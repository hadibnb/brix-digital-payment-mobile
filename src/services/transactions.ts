import { gatewayRequest } from '../api/client';
import type { Transaction, TransactionDirection, TransactionStatus } from '../api/types';
import { toNumber } from '../utils/format';

/**
 * Transaction history. The server decides the status vocabulary; this module
 * preserves the raw string (`statusRaw`) so nothing is lost, and adds a
 * normalised enum purely for iconography and colour.
 */

function normaliseStatus(raw: unknown): { status: TransactionStatus; statusRaw?: string } {
  if (typeof raw !== 'string' || raw.length === 0) return { status: 'unknown' };
  const s = raw.toLowerCase();
  const status: TransactionStatus =
    s.includes('pending') || s.includes('processing') || s.includes('review')
      ? 'pending'
      : s.includes('complete') || s.includes('success') || s.includes('settled') || s.includes('done')
        ? 'completed'
        : s.includes('fail') || s.includes('error') || s.includes('reject')
          ? 'failed'
          : s.includes('cancel') || s.includes('void')
            ? 'cancelled'
            : 'unknown';
  return { status, statusRaw: raw };
}

function normaliseDirection(source: Record<string, unknown>, type?: string): TransactionDirection {
  const dir = typeof source.direction === 'string' ? source.direction.toLowerCase() : '';
  if (dir === 'in' || dir === 'credit' || dir === 'received') return 'in';
  if (dir === 'out' || dir === 'debit' || dir === 'sent') return 'out';
  const t = (type ?? '').toLowerCase();
  if (t.includes('receive') || t.includes('deposit') || t.includes('fund')) return 'in';
  if (t.includes('send') || t.includes('transfer') || t.includes('pay')) return 'out';
  if (t.includes('internal') || t.includes('card')) return 'internal';
  return 'unknown';
}

function pick(source: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
}

export function normaliseTransaction(input: unknown, index: number): Transaction | null {
  if (!input || typeof input !== 'object') return null;
  const t = input as Record<string, unknown>;

  const id = String(pick(t, 'id', 'uuid', 'transaction_id', 'tx_id') ?? `tx_${index}`);
  const type = pick(t, 'type', 'kind', 'operation', 'category');
  const typeStr = typeof type === 'string' ? type : undefined;
  const { status, statusRaw } = normaliseStatus(pick(t, 'status', 'state', 'status_raw'));

  const amount = toNumber(pick(t, 'amount', 'value', 'brix') as number | string | null | undefined);
  const fee = toNumber(pick(t, 'fee', 'fee_brix', 'transaction_fee') as number | string | null | undefined);

  const counterpartyRaw = pick(
    t,
    'counterparty',
    'recipient',
    'recipient_name',
    'sender',
    'sender_name',
    'merchant',
    'to',
    'from',
  );

  const description = pick(t, 'description', 'note', 'memo', 'details', 'title');

  return {
    id,
    type: typeStr,
    direction: normaliseDirection(t, typeStr),
    status,
    statusRaw,
    amount,
    currency: typeof t.currency === 'string' ? t.currency : undefined,
    fee,
    reference:
      typeof pick(t, 'reference', 'ref', 'reference_id', 'tracking_code') === 'string'
        ? String(pick(t, 'reference', 'ref', 'reference_id', 'tracking_code'))
        : undefined,
    counterparty:
      typeof counterpartyRaw === 'string'
        ? counterpartyRaw
        : counterpartyRaw && typeof counterpartyRaw === 'object'
          ? String(
              (counterpartyRaw as Record<string, unknown>).name ??
                (counterpartyRaw as Record<string, unknown>).email ??
                (counterpartyRaw as Record<string, unknown>).id ??
                '',
            ) || undefined
          : undefined,
    description: typeof description === 'string' ? description : undefined,
    createdAt:
      typeof pick(t, 'created_at', 'createdAt', 'date', 'timestamp', 'time') === 'string'
        ? String(pick(t, 'created_at', 'createdAt', 'date', 'timestamp', 'time'))
        : undefined,
    raw: t,
  };
}

export function normaliseTransactionList(payload: unknown): Transaction[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload
      .map((item, i) => normaliseTransaction(item, i))
      .filter((t): t is Transaction => t !== null);
  }
  if (typeof payload === 'object') {
    const root = payload as Record<string, unknown>;
    const list = root.transactions ?? root.items ?? root.data ?? root.results ?? root.history;
    if (Array.isArray(list)) {
      return list
        .map((item, i) => normaliseTransaction(item, i))
        .filter((t): t is Transaction => t !== null);
    }
  }
  return [];
}

export async function fetchTransactions(signal?: AbortSignal): Promise<Transaction[]> {
  const { data } = await gatewayRequest<unknown>('transactions', {
    method: 'GET',
    query: { limit: 50 },
    signal,
  });
  return normaliseTransactionList(data);
}
