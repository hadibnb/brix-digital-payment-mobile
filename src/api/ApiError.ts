export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'server'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'validation'
  | 'duplicate'
  | 'unverifiedEndpoint'
  | 'cleartextBlocked'
  | 'unknown';

export type ApiErrorInit = {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  /** True when retrying the identical request could succeed. */
  retryable?: boolean;
  raw?: unknown;
};

/**
 * One error type for every failure mode, so screens never have to guess.
 * `messageKey` points at a localised UI string; `message` carries the server text.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly retryable: boolean;
  readonly raw?: unknown;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = 'ApiError';
    this.kind = init.kind;
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.retryable = init.retryable ?? false;
    this.raw = init.raw;
  }

  /** Session is gone — the app must send the user back to login. */
  get isAuthError(): boolean {
    return this.kind === 'unauthorized' || this.kind === 'forbidden';
  }

  get isNetworkError(): boolean {
    return this.kind === 'network' || this.kind === 'timeout';
  }

  /** i18n key for a localised message. */
  get messageKey(): string {
    switch (this.kind) {
      case 'network':
        return 'network.requestFailed';
      case 'timeout':
        return 'network.timeout';
      case 'server':
        return 'errors.server';
      case 'unauthorized':
        return 'errors.unauthorized';
      case 'forbidden':
        return 'errors.forbidden';
      case 'notFound':
        return 'errors.notFound';
      case 'validation':
        return 'errors.validation';
      case 'duplicate':
        return 'errors.duplicate';
      case 'unverifiedEndpoint':
        return 'errors.endpointUnavailable';
      case 'cleartextBlocked':
        return 'errors.insecureTransport';
      default:
        return 'errors.generic';
    }
  }
}

/** Recognises the backend's card-verification failure so it can be shown verbatim. */
export const RECIPIENT_CARD_UNVERIFIED = 'Recipient card could not be verified';

export function isRecipientCardUnverified(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  const text = `${error.message} ${error.code ?? ''}`.toLowerCase();
  return text.includes('could not be verified') || text.includes('card_unverified');
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError({ kind: 'unknown', message: error.message, raw: error });
  }
  return new ApiError({ kind: 'unknown', message: String(error), raw: error });
}
