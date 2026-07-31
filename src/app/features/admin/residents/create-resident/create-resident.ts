import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ResidentType } from '../../../../core/models/domain.models';
import { ResidentService } from '../../../../core/services/resident.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  emailAddress,
  errorMessage,
  mobileNumber,
  notBlank,
  strongPassword,
} from '../../../../core/validators/app.validators';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHeader } from '../../../../shared/components/page-header/page-header';

/**
 * The "Create Resident" form.
 *
 * Each control lists its rules; `error()` turns a broken rule into the red
 * sentence under the field (see core/validators/app.validators.ts).
 */
@Component({
  selector: 'app-create-resident',
  imports: [ReactiveFormsModule, RouterLink, Icon, PageHeader],
  templateUrl: './create-resident.html',
  styleUrl: './create-resident.css',
})
export class CreateResident {
  private formBuilder = inject(FormBuilder);
  private residentService = inject(ResidentService);
  private toast = inject(ToastService);
  private router = inject(Router);

  residentTypes = [
    { value: 'owner', label: 'Owner' },
    { value: 'tenant', label: 'Tenant' },
  ];

  form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, notBlank(), Validators.maxLength(50)]],
    last_name: ['', [Validators.required, notBlank(), Validators.maxLength(50)]],
    email: ['', [Validators.required, emailAddress()]],
    mobile: ['', [Validators.required, mobileNumber()]],
    password: ['', [Validators.required, strongPassword()]],
    property_no: ['', [Validators.required, notBlank(), Validators.maxLength(20)]],
    user_type: ['owner', [Validators.required]],
  });

  submitting = false;
  apiError: string | null = null;
  showPassword = false;

  error(field: string, label: string): string | null {
    return errorMessage(this.form.get(field), label);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  reset(): void {
    this.form.reset({ user_type: 'owner' });
    this.apiError = null;
  }

  /**
   * `stayOnPage` is true for the "Save & add another" button, so the form
   * empties itself instead of navigating away.
   */
  submit(stayOnPage: boolean): void {
    this.apiError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Check the form', 'Some fields still need your attention.');
      return;
    }

    const value = this.form.getRawValue();
    this.submitting = true;

    this.residentService
      .create({
        name: value.name.trim(),
        last_name: value.last_name.trim(),
        email: value.email.trim().toLowerCase(),
        // The API wants a number here, and form inputs always give strings.
        mobile: Number(value.mobile),
        password: value.password,
        property_no: value.property_no.trim(),
        user_type: value.user_type as ResidentType,
      })
      .subscribe({
        next: (message) => {
          this.submitting = false;
          this.toast.success(message, value.name + ' ' + value.last_name + ' can now sign in.');

          if (stayOnPage) {
            this.reset();
          } else {
            this.router.navigate(['/admin/residents']);
          }
        },
        error: (error: Error) => {
          this.submitting = false;
          this.apiError = error.message;
          this.toast.error('Could not create resident', error.message);
        },
      });
  }
}
