import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const passwordPolicyValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const value = String(control.value ?? '');
  return /\p{L}/u.test(value) && /\p{N}/u.test(value)
    ? null
    : { passwordPolicy: true };
};

export const matchingPasswordsValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  return control.get('password')?.value === control.get('confirmPassword')?.value
    ? null
    : { passwordMismatch: true };
};
