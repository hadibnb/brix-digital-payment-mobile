import { gatewayRequest } from '../api/client';
import type { WalletBalance } from '../api/types';
import { toNumber } from '../utils/format';

/**
 * Wallet + dashboard reads.
 *
 * These are gateway routes whose concrete strings are resolved server-side and
 * are NOT present in the public bundle, so they are declared in
 * `endpoints.ts` as REQUIRED-BUT-UNVERIFIED. The UI shows a precise
 * "endpoint not documented" state if the backend rejects them — it never
 * fabricates a balance.
 */

function readString(source: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = source[key];
    if (typeof v === 'string' && v.length > 0) return v;
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

function readNumber(source: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const n = toNumber(source[key] as number | string | null | undefined);
    if (n !== null) return n;
  }
  return null;
}

export function normaliseWallet(payload: unknown): WalletBalance | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  const w = (
    (root.wallet as Record<string, unknown> | undefined) ??
    (root.balance as Record<string, unknown> | undefined) ??
    root
  ) as Record<string, unknown>;

  const brix = readNumber(w, 'brix', 'balance', 'brix_balance', 'available_balance', 'amount');
  if (brix === null && readString(w, 'wallet_id', 'id') === undefined) return null;

  return {
    brix,
    currency: readString(w, 'currency', 'local_currency'),
    localRate: readNumber(w, 'local_rate', 'rate', 'brix_local'),
    available: readNumber(w, 'available', 'available_balance'),
    pending: readNumber(w, 'pending', 'pending_balance'),
    walletId: readString(w, 'wallet_id', 'id', 'walletId'),
    accountNumber: readString(w, 'account_number', 'account', 'receive_id'),
    updatedAt: readString(w, 'updated_at', 'updatedAt'),
  };
}

export async function fetchWallet(signal?: AbortSignal): Promise<WalletBalance | null> {
  const { data } = await gatewayRequest<unknown>('wallet', { method: 'GET', signal });
  return normaliseWallet(data);
}

export type OverviewData = {
  wallet: WalletBalance | null;
  status?: string;
  pendingCount: number | null;
  raw: unknown;
};

export function normaliseOverview(payload: unknown): OverviewData {
  if (!payload || typeof payload !== 'object') {
    return { wallet: null, pendingCount: null, raw: payload };
  }
  const root = payload as Record<string, unknown>;
  return {
    wallet: normaliseWallet(payload),
    status: readString(root, 'status', 'account_status', 'state'),
    pendingCount: readNumber(root, 'pending_count', 'pending', 'pending_items'),
    raw: payload,
  };
}

export async function fetchOverview(signal?: AbortSignal): Promise<OverviewData> {
  const [walletResult, meResult] = await Promise.all([
    gatewayRequest<unknown>('wallet', { method: 'GET', signal }),
    gatewayRequest<unknown>('overview', { method: 'GET', signal }),
  ]);
  const me = meResult.data;
  const root = me && typeof me === 'object' ? (me as Record<string, unknown>) : {};
  return {
    wallet: normaliseWallet(walletResult.data),
    status: readString(root, 'status', 'account_status', 'state') ??
      (root.user && typeof root.user === 'object' ? readString(root.user as Record<string, unknown>, 'status') : undefined),
    pendingCount: null,
    raw: { me, wallet: walletResult.data },
  };
}

/** Account payload for the Account screen. */
export async function fetchAccount(signal?: AbortSignal): Promise<Record<string, unknown> | null> {
  const { data } = await gatewayRequest<unknown>('overview', {
    method: 'GET',
    signal,
  });
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  const account = root.account ?? root.profile ?? root.user;
  if (account && typeof account === 'object') return account as Record<string, unknown>;
  return root;
}
