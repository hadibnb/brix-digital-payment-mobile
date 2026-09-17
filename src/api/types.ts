/**
 * Typed wire models for the BRIX backend.
 *
 * Only shapes that were observed live are declared as required. Every
 * authenticated business object is declared with optional fields, because the
 * mobile client must degrade gracefully rather than crash if the server adds
 * or omits a field.
 */

/** Envelope used by the direct PHP scripts, e.g. rate-engine.php / funding-config.php */
export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string | ApiErrorBody;
  message?: string;
};

export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: unknown;
};

/** GET /rate-engine.php?currency=XX — shape confirmed live. */
export type RateQuote = {
  currency: string;
  brix_local: number;
  unit: string;
  source?: string;
  updated_at?: string;
  status?: string;
  methodology?: string;
  stale?: boolean;
};

/** GET /funding-config.php — shape confirmed live. */
export type FundingConfig = {
  iran_sheba: string;
  bale_app_url: string;
  brix_usd_reference: number;
  card_issuance_fee_brix: string;
  transaction_fee_brix: string;
  usdc_wallet: string;
};

export type SessionUser = {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  baleVerified?: boolean;
  status?: string;
  kycStatus?: string;
  createdAt?: string;
  /** Raw server payload, kept so nothing is silently dropped. */
  raw?: Record<string, unknown>;
};

export type Session = {
  accessToken?: string;
  csrfToken?: string;
  user: SessionUser;
  expiresAt?: string;
};

export type WalletBalance = {
  /** BRIX ledger balance. */
  brix: number | string | null;
  /** Local-reference currency code. */
  currency?: string;
  /** 1 BRIX = localRate <currency> */
  localRate?: number | null;
  available?: number | string | null;
  pending?: number | string | null;
  walletId?: string;
  accountNumber?: string;
  updatedAt?: string;
};

export type TransactionDirection = 'in' | 'out' | 'internal' | 'unknown';

export type TransactionStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'unknown';

export type Transaction = {
  id: string;
  type?: string;
  direction?: TransactionDirection;
  status?: TransactionStatus;
  /** Raw server status string, preserved verbatim. */
  statusRaw?: string;
  amount?: number | string | null;
  currency?: string;
  fee?: number | string | null;
  reference?: string;
  counterparty?: string;
  description?: string;
  createdAt?: string;
  raw?: Record<string, unknown>;
};

export type BrixCard = {
  id: string;
  /** Masked internal identifier — the backend does not expose PAN/CVV. */
  maskedNumber?: string;
  holderName?: string;
  status?: string;
  frozen?: boolean;
  issuedAt?: string;
  raw?: Record<string, unknown>;
};

export type CardIssuanceQuote = {
  cardIssuanceFeeBrix?: string | number | null;
  transactionFeeBrix?: string | number | null;
  raw?: Record<string, unknown>;
};

export type Merchant = {
  id: string;
  name?: string;
  category?: string;
  website?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  raw?: Record<string, unknown>;
};

export type NotificationItem = {
  id: string;
  title?: string;
  body?: string;
  createdAt?: string;
  read?: boolean;
  kind?: string;
  raw?: Record<string, unknown>;
};

/** Outcome wrapper: distinguishes live backend data from offline fallback. */
export type Sourced<T> = {
  data: T;
  source: 'live' | 'fallback';
  fetchedAt: string;
  /** Present when `source === 'fallback'`. */
  reason?: string;
};
