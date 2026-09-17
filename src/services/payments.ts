import { gatewayRequest } from '../api/client';
import { ApiError } from '../api/ApiError';
import type { Merchant } from '../api/types';

/**
 * Send / Transfers, Pay (QR), Merchant and Fund BRIX write operations.
 *
 * Every one of these is a state-changing financial operation, so each:
 *   - sends an Idempotency-Key (the backend deduplicates on it, exactly like the
 *     web client's `opts.idempotency` path)
 *   - is guarded by `useMutation` upstream (disabled + ref latch)
 *   - only reports success after the backend confirms it
 */

export type TransferArgs = {
  recipient: string;
  amount: string;
  note?: string;
  currency?: string;
};

export type TransferResult = {
  reference?: string;
  status?: string;
  fee?: string | number | null;
  raw: unknown;
};

function pick(source: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0
    ? value
    : typeof value === 'number'
      ? String(value)
      : undefined;
}

function unwrap(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};
  const root = data as Record<string, unknown>;
  const nested = root.transaction ?? root.transfer ?? root.payment ?? root.result;
  if (nested && typeof nested === 'object') return nested as Record<string, unknown>;
  return root;
}

/** Send BRIX to another account. */
export async function sendTransfer(args: TransferArgs): Promise<TransferResult> {
  if (!args.recipient.trim()) {
    throw new ApiError({
      kind: 'validation',
      message: 'A recipient is required.',
      code: 'RECIPIENT_REQUIRED',
    });
  }
  const { data } = await gatewayRequest<unknown>('transfer', {
    method: 'POST',
    body: {
      receiver_account_public_id: args.recipient.trim(),
      amount: args.amount,
      description: args.note,
      currency: args.currency ?? 'BRIX',
    },
    idempotency: true,
  });
  const t = unwrap(data);
  return {
    reference: asString(pick(t, 'reference', 'ref', 'transaction_id', 'tracking_code')),
    status: asString(pick(t, 'status', 'state')),
    fee: (pick(t, 'fee', 'fee_brix', 'transaction_fee') ?? null) as string | number | null,
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Pay
// ---------------------------------------------------------------------------

export type PaymentTarget = {
  /** Raw code scanned from a QR or typed by hand. */
  code: string;
  amount?: string;
  note?: string;
};

export type ResolvedPayment = {
  merchantName?: string;
  merchantId?: string;
  amountDue?: string | number | null;
  currency?: string;
  reference?: string;
  raw: unknown;
};

/**
 * Step 1 of Pay: resolve a payment code so the user can see WHO they are paying
 * before confirming. Nothing is debited here.
 */
export async function resolvePayment(code: string, _signal?: AbortSignal): Promise<ResolvedPayment> {
  const clean = code.trim().replace(/^brix:/i, '');
  if (!clean) {
    throw new ApiError({
      kind: 'validation',
      message: 'A payment code is required.',
      code: 'CODE_REQUIRED',
    });
  }

  // BRIX Core v11.6 does not expose a public payment-resolve endpoint. Do not
  // invent one. The payment API itself validates the merchant at confirmation
  // time, so this local resolve step only prepares a review target.
  return {
    merchantId: clean,
    merchantName: clean,
    amountDue: null,
    currency: 'BRIX',
    raw: { merchant_id: clean, source: 'local-code-parse' },
  };
}

/** Step 2 of Pay: execute. Only a backend-confirmed response is a success. */
export async function executePayment(target: PaymentTarget): Promise<TransferResult> {
  const { data } = await gatewayRequest<unknown>('paymentExecute', {
    method: 'POST',
    body: {
      merchant_id: target.code.trim().replace(/^brix:/i, ''),
      currency: 'BRIX',
      amount: target.amount,
      description: target.note,
    },
    idempotency: true,
  });
  const t = unwrap(data);
  return {
    reference: asString(pick(t, 'reference', 'ref', 'transaction_id')),
    status: asString(pick(t, 'status', 'state')),
    fee: (pick(t, 'fee', 'fee_brix') ?? null) as string | number | null,
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Merchant
// ---------------------------------------------------------------------------

export function normaliseMerchant(input: unknown, index: number): Merchant | null {
  if (!input || typeof input !== 'object') return null;
  const m = input as Record<string, unknown>;
  const id = asString(pick(m, 'id', 'merchant_id', 'uuid')) ?? `merchant_${index}`;
  return {
    id,
    name: asString(pick(m, 'name', 'merchant_name', 'title')),
    category: asString(pick(m, 'category', 'type')),
    website: asString(pick(m, 'website', 'url', 'store_url')),
    description: asString(pick(m, 'description', 'details')),
    status: asString(pick(m, 'status', 'state', 'approval_status')),
    createdAt: asString(pick(m, 'created_at', 'createdAt')),
    raw: m,
  };
}

export async function fetchMerchants(signal?: AbortSignal): Promise<Merchant[]> {
  const { data } = await gatewayRequest<unknown>('merchants', { method: 'GET', signal });
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
      ? (((data as Record<string, unknown>).merchants ??
          (data as Record<string, unknown>).items ??
          (data as Record<string, unknown>).data) as unknown)
      : null;
  if (!Array.isArray(list)) return [];
  return list
    .map((item, i) => normaliseMerchant(item, i))
    .filter((m): m is Merchant => m !== null);
}

export type MerchantCreateArgs = {
  name: string;
  category?: string;
  website?: string;
  description?: string;
};

/**
 * Merchant onboarding. Status is decided by BRIX operations — the client never
 * shows a locally granted approval.
 */
export async function createMerchant(args: MerchantCreateArgs): Promise<Merchant | null> {
  const { data } = await gatewayRequest<unknown>('merchantCreate', {
    method: 'POST',
    body: {
      legal_name: args.name.trim(),
      trading_name: args.name.trim(),
      country_code: 'IR',
      category_code: args.category ?? '',
      website: args.website ?? '',
    },
    idempotency: true,
  });
  return normaliseMerchant(data, 0);
}

export async function merchantRequestPayment(args: {
  merchantId: string;
  amount: string;
  note?: string;
}): Promise<TransferResult> {
  const { data } = await gatewayRequest<unknown>('merchantPay', {
    method: 'POST',
    body: {
      merchant_id: args.merchantId.trim(),
      currency: 'BRIX',
      amount: args.amount,
      description: args.note,
    },
    idempotency: true,
  });
  const t = unwrap(data);
  return {
    reference: asString(pick(t, 'reference', 'ref', 'transaction_id')),
    status: asString(pick(t, 'status', 'state')),
    raw: data,
  };
}

// ---------------------------------------------------------------------------
// Fund BRIX
// ---------------------------------------------------------------------------

export type FundingRequestArgs = {
  amountLocal?: string;
  currency?: string;
  phone?: string;
  /** Local URI of an attached proof image, when the user attached one. */
  proofUri?: string;
  method: 'usdc' | 'fiat';
};

export type FundingRequestResult = {
  reference?: string;
  status?: string;
  raw: unknown;
};

/**
 * Funding request.
 *
 * The existing flow is a *proof-upload* flow — the web client has
 * `#fundingProof` / `#fundingProofStatus`, i.e. the user submits evidence and
 * BRIX operations reviews it. It is NOT an automated on-chain watcher, so this
 * function never claims the balance changed. The response is a request
 * acknowledgement, and the UI says "submitted for review".
 */
export async function submitFundingRequest(
  args: FundingRequestArgs,
): Promise<FundingRequestResult> {
  const isUsdc = args.method === 'usdc';
  const body: Record<string, unknown> = isUsdc
    ? {
        amount: args.amountLocal,
        network: 'BEP20-BSC',
        evidence: args.proofUri ? { proof_uri: args.proofUri, phone: args.phone } : undefined,
      }
    : {
        currency: args.currency ?? 'IRR',
        amount: args.amountLocal,
        network: 'IRAN-BANK-SHEBA',
        evidence: args.proofUri ? { proof_uri: args.proofUri, phone: args.phone } : undefined,
      };

  const { data } = await gatewayRequest<unknown>(isUsdc ? 'fundingUsdc' : 'fundingManual', {
    method: 'POST',
    body,
    idempotency: true,
  });
  const t = unwrap(data);
  return {
    reference: asString(pick(t, 'reference', 'ref', 'request_id')),
    status: asString(pick(t, 'status', 'state')),
    raw: data,
  };
}

export { ApiError };
