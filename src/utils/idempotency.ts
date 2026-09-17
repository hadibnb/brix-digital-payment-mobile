/**
 * Idempotency keys mirror the web client:
 *   if (opts.idempotency) headers['Idempotency-Key'] = crypto.randomUUID()
 *
 * The BRIX backend deduplicates state-changing requests by this header, which
 * is what makes "one deliberate payment, submitted once" safe even if the
 * device retries after a dropped connection.
 */

let counter = 0;

function randomUuid(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto && typeof g.crypto.randomUUID === 'function') return g.crypto.randomUUID();
  // RFC4122 v4 fallback for runtimes without crypto.randomUUID.
  counter += 1;
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i += 1) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += hex[((counter + i) % 4) + 8];
    else out += hex[Math.floor(Math.random() * 16)];
  }
  return out;
}

export function newIdempotencyKey(): string {
  return randomUuid();
}

/**
 * A tiny in-flight gate. It is the second line of defence behind
 * `disabled={submitting}`: even if a handler fires twice, the same logical
 * operation cannot be dispatched concurrently.
 */
const inFlight = new Set<string>();

export function beginOnce(key: string): boolean {
  if (inFlight.has(key)) return false;
  inFlight.add(key);
  return true;
}

export function endOnce(key: string): void {
  inFlight.delete(key);
}

export function isInFlight(key: string): boolean {
  return inFlight.has(key);
}

/**
 * Runs `fn` at most once at a time per `key`. Returns `undefined` if another
 * call with the same key is already running.
 */
export async function runOnce<T>(key: string, fn: () => Promise<T>): Promise<T | undefined> {
  if (!beginOnce(key)) return undefined;
  try {
    return await fn();
  } finally {
    endOnce(key);
  }
}
