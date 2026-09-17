/**
 * Number / date formatting for BRIX amounts.
 *
 * BRIX is an internal ledger unit. The spec is explicit:
 *   - never show an artificial USD price for BRIX
 *   - never use an 18-decimal crypto-style display
 *   - show 2–3 decimals where appropriate
 */

const BRIX_DECIMALS = 3;
const MIN_VISIBLE_DECIMALS = 2;

/** Formats a BRIX ledger amount: 1234.5 -> "1,234.500" */
export function formatBrix(
  value: number | string | null | undefined,
  decimals: number = BRIX_DECIMALS,
): string {
  const n = toNumber(value);
  if (n === null) return '—';
  const safeDecimals = Math.min(6, Math.max(MIN_VISIBLE_DECIMALS, decimals));
  return groupThousands(n.toFixed(safeDecimals));
}

/** Formats a local-reference currency amount: "25.708 AED" */
export function formatLocal(
  value: number | string | null | undefined,
  currency: string,
  decimals = 2,
): string {
  const n = toNumber(value);
  if (n === null) return '—';
  return `${groupThousands(n.toFixed(decimals))} ${currency}`;
}

/**
 * Converts a BRIX amount into the user's selected local-reference currency.
 * The rate means: 1 BRIX = rate * <currency>.
 */
export function brixToLocal(
  brixAmount: number | string | null | undefined,
  rate: number | null | undefined,
): number | null {
  const brix = toNumber(brixAmount);
  const r = toNumber(rate);
  if (brix === null || r === null) return null;
  return brix * r;
}

/**
 * Converts a local currency amount into BRIX using the same rate.
 * Guarded against a zero/negative rate.
 */
export function localToBrix(
  localAmount: number | string | null | undefined,
  rate: number | null | undefined,
): number | null {
  const amount = toNumber(localAmount);
  const r = toNumber(rate);
  if (amount === null || r === null || r <= 0) return null;
  return amount / r;
}

export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function groupThousands(fixed: string): string {
  const negative = fixed.startsWith('-');
  const plain = negative ? fixed.slice(1) : fixed;
  const [intPart = '0', fracPart] = plain.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const body = fracPart ? `${grouped}.${fracPart}` : grouped;
  return negative ? `-${body}` : body;
}

/** "2026-09-17T05:51:30+00:00" -> "17 Sep 2026, 05:51" */
export function formatDateTime(input: string | null | undefined, locale = 'en'): string {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().replace('T', ' ').slice(0, 16);
  }
}

export function formatDate(input: string | null | undefined, locale = 'en'): string {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** Shortens an identifier for display: "brix_9f2c1a…77de" */
export function shortenId(id: string | null | undefined, head = 8, tail = 4): string {
  if (!id) return '—';
  const s = String(id);
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

/** Masks a card identifier: keeps the last 4 visible. */
export function maskCard(value: string | null | undefined): string {
  if (!value) return '—';
  const s = String(value).replace(/\s+/g, '');
  if (s.includes('•') || s.includes('*')) return String(value);
  if (s.length <= 4) return `•••• ${s}`;
  return `•••• •••• •••• ${s.slice(-4)}`;
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  const n = toNumber(value);
  if (n === null) return '—';
  return `${n.toFixed(decimals)}%`;
}
