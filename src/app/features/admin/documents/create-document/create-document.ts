import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { DocumentService } from '../../../../core/services/document.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  errorMessage,
  fileConstraints,
  notBlank,
} from '../../../../core/validators/app.validators';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHeader } from '../../../../shared/components/page-header/page-header';

const MAX_FILE_MB = 10;
const FILE_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'webp'];

/** The "Create Document" form, including the file upload box. */
@Component({
  selector: 'app-create-document',
  imports: [ReactiveFormsModule, RouterLink, Icon, PageHeader],
  templateUrl: './create-document.html',
  styleUrl: './create-document.css',
})
export class CreateDocument {
  private formBuilder = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private toast = inject(ToastService);
  private router = inject(Router);

  /** Shown as a dropdown of suggestions; any text is allowed. */
  categorySuggestions = [
    'Agreement Document',
    'Rental Contract',
    'Property Insurance',
    'Maintenance Invoice',
    'Society Bye-laws',
    'NOC',
  ];

  form = this.formBuilder.nonNullable.group({
    document_title: ['', [Validators.required, notBlank(), Validators.maxLength(120)]],
    document_category: ['', [Validators.required, notBlank(), Validators.maxLength(60)]],
    expiry_date: ['', [Validators.required]],
    remarks: ['', [Validators.maxLength(500)]],
    file: this.formBuilder.control<File | null>(null, [
      Validators.required,
      fileConstraints(MAX_FILE_MB, FILE_TYPES),
    ]),
  });

  submitting = false;
  apiError: string | null = null;
  dragging = false;

  /** The accepted file, once it passed the rules. */
  selectedFile: File | null = null;

  accept = FILE_TYPES.map((type) => '.' + type).join(',');
  maxSizeMb = MAX_FILE_MB;

  error(field: string, label: string): string | null {
    return errorMessage(this.form.get(field), label);
  }

  /** "480 KB" or "2.4 MB", shown next to the file name. */
  fileSize(): string {
    const file = this.selectedFile;
    if (!file) {
      return '';
    }
    const kb = file.size / 1024;
    if (kb < 1024) {
      return Math.round(kb) + ' KB';
    }
    return (kb / 1024).toFixed(1) + ' MB';
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.useFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging = false;

    const files = event.dataTransfer ? event.dataTransfer.files : null;
    this.useFile(files && files.length > 0 ? files[0] : null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
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
    this.form.reset();
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

    this.documentService
      .create({
        document_title: value.document_title.trim(),
        document_category: value.document_category.trim(),
        expiry_date: value.expiry_date,
        remarks: value.remarks.trim(),
        file: value.file,
      })
      .subscribe({
        next: (message) => {
          this.submitting = false;
          this.toast.success(message, 'It will appear in notifications on its expiry date.');
          this.router.navigate(['/admin/documents']);
        },
        error: (error: Error) => {
          this.submitting = false;
          this.apiError = error.message;
          this.toast.error('Could not create document', error.message);
        },
      });
  }

  private useFile(file: File | null): void {
    const control = this.form.controls.file;
    control.setValue(file);
    control.markAsTouched();

    // Only show the file card when the file is actually acceptable.
    this.selectedFile = control.valid ? file : null;
  }
}
