import { toNumber } from './format';

export type ValidationResult = { ok: true } | { ok: false; messageKey: string };

const OK: ValidationResult = { ok: true };

export function required(value: unknown): ValidationResult {
  if (value === null || value === undefined) return { ok: false, messageKey: 'validation.required' };
  if (typeof value === 'string' && value.trim().length === 0) {
    return { ok: false, messageKey: 'validation.required' };
  }
  return OK;
}

/** Accepts an email address or a phone number, matching the web login field. */
export function validateIdentifier(value: string): ValidationResult {
  const v = value.trim();
  if (v.length === 0) return { ok: false, messageKey: 'validation.required' };
  const looksLikeEmail = v.includes('@');
  if (looksLikeEmail) return validateEmail(v);
  return validatePhone(v);
}

export function validateEmail(value: string): ValidationResult {
  const v = value.trim();
  if (v.length === 0) return { ok: false, messageKey: 'validation.required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    return { ok: false, messageKey: 'validation.invalidEmail' };
  }
  return OK;
}

export function validatePhone(value: string): ValidationResult {
  const v = value.replace(/[\s()-]/g, '');
  if (v.length === 0) return { ok: false, messageKey: 'validation.required' };
  if (!/^\+?\d{7,15}$/.test(v)) return { ok: false, messageKey: 'validation.invalidPhone' };
  return OK;
}

export function validatePassword(value: string, min = 8): ValidationResult {
  if (!value) return { ok: false, messageKey: 'validation.required' };
  if (value.length < min) return { ok: false, messageKey: 'validation.passwordMin' };
  return OK;
}

export function validatePasswordMatch(a: string, b: string): ValidationResult {
  if (a !== b) return { ok: false, messageKey: 'validation.mismatch' };
  return OK;
}

export function validateVerificationCode(value: string): ValidationResult {
  const v = value.trim();
  if (v.length === 0) return { ok: false, messageKey: 'validation.required' };
  if (!/^\d{4,8}$/.test(v)) return { ok: false, messageKey: 'validation.invalidCode' };
  return OK;
}

/** BRIX amounts use at most 6 decimals; anything finer is rejected. */
export function validateBrixAmount(value: string): ValidationResult {
  const n = toNumber(value);
  if (n === null) return { ok: false, messageKey: 'validation.invalidAmount' };
  if (n <= 0) return { ok: false, messageKey: 'validation.amountPositive' };
  const decimals = (value.split('.')[1] ?? '').length;
  if (decimals > 6) return { ok: false, messageKey: 'validation.invalidAmount' };
  return OK;
}

export function validateNotExceeding(
  amount: number,
  available: number,
): ValidationResult {
  if (!Number.isFinite(amount) || !Number.isFinite(available)) {
    return { ok: false, messageKey: 'validation.invalidAmount' };
  }
  if (amount > available) return { ok: false, messageKey: 'validation.insufficient' };
  return OK;
}

export function validateRecipientCard(value: string): ValidationResult {
  const v = value.trim();
  if (v.length === 0) return { ok: false, messageKey: 'validation.recipientRequired' };
  if (v.length < 6) return { ok: false, messageKey: 'validation.recipientRequired' };
  return OK;
}
