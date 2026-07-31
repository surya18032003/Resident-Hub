import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Extra form rules, on top of Angular's built-in ones (Validators.required,
 * Validators.maxLength, ...).
 *
 * A validator is just a function that receives the control and returns:
 *   null                     -> the value is fine
 *   { someErrorName: true }  -> the value is wrong
 *
 * The name in that object is what `errorMessage()` at the bottom looks for.
 */

/** Rejects a value made only of spaces. */
export function notBlank(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (typeof value === 'string' && value.trim() === '') {
      return { notBlank: true };
    }
    return null;
  };
}

/** Angular's built-in email rule accepts "a@b"; this one wants "a@b.com". */
export function emailAddress(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value || '').trim();
    if (value === '') {
      return null; // "required" is a separate rule
    }
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(value);
    return looksLikeEmail ? null : { email: true };
  };
}

/** 10 digits starting with 6-9, matching the numbers the API already holds. */
export function mobileNumber(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value || '').trim();
    if (value === '') {
      return null;
    }
    return /^[6-9]\d{9}$/.test(value) ? null : { mobileNumber: true };
  };
}

/** At least 8 characters, with a letter, a number and a symbol. */
export function strongPassword(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value || '');
    if (value === '') {
      return null;
    }

    const longEnough = value.length >= 8;
    const hasLetter = /[A-Za-z]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSymbol = /[^A-Za-z0-9]/.test(value);

    if (longEnough && hasLetter && hasDigit && hasSymbol) {
      return null;
    }
    return { strongPassword: true };
  };
}

/**
 * Checks the File held by a control.
 * Example: fileConstraints(5, ['png', 'jpg']) -> max 5 MB, only those types.
 */
export function fileConstraints(maxSizeMb: number, extensions: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const file: File | null = control.value;
    if (!file) {
      return null;
    }

    const parts = file.name.split('.');
    const extension = parts[parts.length - 1].toLowerCase();
    if (!extensions.includes(extension)) {
      return { fileType: extensions };
    }

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return { fileSize: maxSizeMb };
    }

    return null;
  };
}

/**
 * Turns a control's error into a sentence for the user.
 *
 * Every form calls this instead of writing an <p> per rule, e.g.
 *   error('email', 'Email')  ->  "Enter a valid email address, ..."
 *
 * Returns null when the field is fine, or when the user has not touched it
 * yet — nobody wants red text on a form they have not filled in.
 */
export function errorMessage(control: AbstractControl | null, label: string): string | null {
  if (!control || !control.errors) {
    return null;
  }
  if (!control.touched && !control.dirty) {
    return null;
  }

  const errors = control.errors;

  if (errors['required'] || errors['notBlank']) {
    return label + ' is required.';
  }
  if (errors['email']) {
    return 'Enter a valid email address, for example name@example.com.';
  }
  if (errors['mobileNumber']) {
    return 'Enter a valid 10-digit mobile number.';
  }
  if (errors['strongPassword']) {
    return 'Use at least 8 characters with a letter, a number and a symbol.';
  }
  if (errors['minlength']) {
    return label + ' must be at least ' + errors['minlength'].requiredLength + ' characters.';
  }
  if (errors['maxlength']) {
    return label + ' must be ' + errors['maxlength'].requiredLength + ' characters or fewer.';
  }
  if (errors['fileType']) {
    return 'Allowed file types: ' + errors['fileType'].join(', ') + '.';
  }
  if (errors['fileSize']) {
    return 'File must be smaller than ' + errors['fileSize'] + ' MB.';
  }

  return label + ' is invalid.';
}
