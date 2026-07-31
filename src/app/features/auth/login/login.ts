import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { emailAddress, errorMessage, notBlank } from '../../../core/validators/app.validators';
import { Icon } from '../../../shared/components/icon/icon';

/**
 * The sign-in page.
 *
 * It uses a Reactive Form: the form lives in TypeScript (`form` below) and the
 * template connects to it with [formGroup] and formControlName.
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private formBuilder = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  /**
   * Two fields, each with its rules. `nonNullable` simply means the values are
   * always strings, never null, which keeps the TypeScript simpler.
   */
  form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, emailAddress()]],
    password: ['', [Validators.required, notBlank(), Validators.minLength(6)]],
  });

  /** true while the request is running, so the button can show a spinner. */
  submitting = false;

  /** The red box above the form; null when there is nothing to report. */
  apiError: string | null = null;

  showPassword = false;

  /** The message under a field, or null when the field is fine. */
  error(field: string, label: string): string | null {
    return errorMessage(this.form.get(field), label);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /** Fills in one of the two test accounts. */
  useDemo(role: string): void {
    if (role === 'admin') {
      this.form.setValue({ email: 'admin@gmail.com', password: 'Admin@123' });
    } else {
      this.form.setValue({ email: 'newuser@gmail.com', password: 'test@123' });
    }
    this.apiError = null;
  }

  submit(): void {
    this.apiError = null;

    // Stop here if anything is invalid, and reveal the messages by marking
    // every field as "touched".
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    this.auth.login(this.form.getRawValue()).subscribe({
      next: (session) => {
        this.submitting = false;
        const roleName = session.role === 'admin' ? 'Super Admin' : 'Resident';
        this.toast.success('Welcome back', 'Signed in as ' + roleName + '.');
        this.router.navigateByUrl(this.whereToGo());
      },
      error: (error: Error) => {
        this.submitting = false;
        this.apiError = error.message;
      },
    });
  }

  /**
   * Normally the role's dashboard. If the guard sent the user here from a
   * protected page, go back to that page instead — but only when it belongs to
   * this role, otherwise they would just be bounced again.
   */
  private whereToGo(): string {
    const home = this.auth.homeRoute();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (!returnUrl || !returnUrl.startsWith('/')) {
      return home;
    }

    const section = this.auth.isAdmin() ? '/admin' : '/resident';
    return returnUrl.startsWith(section) ? returnUrl : home;
  }
}
