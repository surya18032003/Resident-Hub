import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AnnouncementService } from '../../../../core/services/announcement.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  errorMessage,
  fileConstraints,
  notBlank,
} from '../../../../core/validators/app.validators';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHeader } from '../../../../shared/components/page-header/page-header';

/** Rules for the image: at most 5 MB, and only these file types. */
const MAX_IMAGE_MB = 5;
const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

/** The "Create Announcement" form, including the image picker. */
@Component({
  selector: 'app-create-announcement',
  imports: [ReactiveFormsModule, RouterLink, Icon, PageHeader],
  templateUrl: './create-announcement.html',
  styleUrl: './create-announcement.css',
})
export class CreateAnnouncement {
  private formBuilder = inject(FormBuilder);
  private announcementService = inject(AnnouncementService);
  private toast = inject(ToastService);
  private router = inject(Router);

  categories = [
    { value: 'announcement', label: 'Announcement' },
    { value: 'event', label: 'Event' },
    { value: 'updates', label: 'Updates' },
  ];

  form = this.formBuilder.nonNullable.group({
    category: ['announcement', [Validators.required]],
    title: ['', [Validators.required, notBlank(), Validators.maxLength(120)]],
    summary: ['', [Validators.required, notBlank(), Validators.maxLength(1000)]],
    event_date: ['', [Validators.required]],
    // The image is optional — the API is happy without one.
    image: this.formBuilder.control<File | null>(null, [
      fileConstraints(MAX_IMAGE_MB, IMAGE_TYPES),
    ]),
  });

  submitting = false;
  apiError: string | null = null;

  /** A temporary address for the chosen file, so we can preview it. */
  previewUrl: string | null = null;
  selectedFile: File | null = null;

  /** true while a file is being dragged over the drop zone. */
  dragging = false;

  /** For the file input: ".png,.jpg,..." */
  accept = IMAGE_TYPES.map((type) => '.' + type).join(',');
  maxSizeMb = MAX_IMAGE_MB;

  error(field: string, label: string): string | null {
    return errorMessage(this.form.get(field), label);
  }

  /** Runs when a file is chosen with the file dialog. */
  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.useFile(file);
  }

  /** Runs when a file is dropped on the box. */
  onDrop(event: DragEvent): void {
    event.preventDefault(); // stop the browser from opening the file
    this.dragging = false;

    const files = event.dataTransfer ? event.dataTransfer.files : null;
    this.useFile(files && files.length > 0 ? files[0] : null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault(); // required, or the drop event never fires
    this.dragging = true;
  }

  onDragLeave(): void {
    this.dragging = false;
  }

  clearFile(input?: HTMLInputElement): void {
    if (input) {
      input.value = '';
    }
    this.useFile(null);
  }

  reset(input?: HTMLInputElement): void {
    this.form.reset({ category: 'announcement', event_date: '' });
    this.clearFile(input);
    this.apiError = null;
  }

  submit(): void {
    this.apiError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Check the form', 'Some fields still need your attention.');
      return;
    }

    const value = this.form.getRawValue();
    this.submitting = true;

    this.announcementService
      .create({
        category: value.category,
        title: value.title.trim(),
        summary: value.summary.trim(),
        event_date: value.event_date,
        image: value.image,
      })
      .subscribe({
        next: (message) => {
          this.submitting = false;
          this.toast.success(message, 'Residents can see it in their feed right away.');
          this.router.navigate(['/admin/announcements']);
        },
        error: (error: Error) => {
          this.submitting = false;
          this.apiError = error.message;
          this.toast.error('Could not create announcement', error.message);
        },
      });
  }

  /** Puts the file into the form and builds the preview. */
  private useFile(file: File | null): void {
    const control = this.form.controls.image;
    control.setValue(file);
    control.markAsTouched();

    // Release the previous preview address, or the browser keeps the old file.
    const oldPreview = this.previewUrl;
    if (oldPreview) {
      URL.revokeObjectURL(oldPreview);
    }

    this.selectedFile = file;

    // Only preview a file that passed the size and type rules.
    if (file && control.valid) {
      this.previewUrl = URL.createObjectURL(file);
    } else {
      this.previewUrl = null;
    }
  }
}
