import { directRequest, gatewayRequest } from '../api/client';
import { CARD_API_ROUTES, DIRECT_ENDPOINTS } from '../api/endpoints';
import { ApiError } from '../api/ApiError';
import type { BrixCard, CardIssuanceQuote } from '../api/types';

/**
 * BRIX Card.
 *
 * The existing card is an INTERNAL PRE-APPROVAL card. The backend returns a
 * masked identifier only — `#cardNumberMasked` in the web client — so this
 * module never models a PAN, a CVV or a card network. Adding those would be
 * inventing functionality the backend does not have.
 */

function pick(source: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
}

function str(source: Record<string, unknown>, ...keys: string[]): string | undefined {
  const v = pick(source, ...keys);
  return typeof v === 'string' && v.length > 0 ? v : typeof v === 'number' ? String(v) : undefined;
}

export function normaliseCard(input: unknown): BrixCard | null {
  if (!input || typeof input !== 'object') return null;
  const c = input as Record<string, unknown>;
  const id = str(c, 'id', 'card_id', 'uuid');
  if (!id) return null;

  const status = str(c, 'status', 'state');

  return {
    id,
    maskedNumber: str(c, 'masked_number', 'card_number_masked', 'number_masked', 'masked', 'number'),
    holderName: str(c, 'holder_name', 'holderName', 'holder', 'name'),
    status,
    frozen:
      typeof c.frozen === 'boolean'
        ? (c.frozen as boolean)
        : status
          ? /frozen|blocked|suspended/i.test(status)
          : undefined,
    issuedAt: str(c, 'issued_at', 'created_at', 'createdAt'),
    raw: c,
  };
}

/**
 * Card lookup goes through the card API script, matching the web client:
 *   fetch('card-api.php?route=' + encodeURIComponent('/api/cards'))
 */
export async function fetchCards(signal?: AbortSignal): Promise<BrixCard[]> {
  const { data } = await directRequest<unknown>(DIRECT_ENDPOINTS.cardApi, {
    method: 'GET',
    query: { route: CARD_API_ROUTES.list },
    signal,
  });
  if (Array.isArray(data)) {
    return data.map(normaliseCard).filter((c): c is BrixCard => c !== null);
  }
  if (data && typeof data === 'object') {
    const root = data as Record<string, unknown>;
    const list = root.cards ?? root.items ?? root.data;
    if (Array.isArray(list)) {
      return list.map(normaliseCard).filter((c): c is BrixCard => c !== null);
    }
    const single = normaliseCard(root);
    return single ? [single] : [];
  }
  return [];
}

export async function fetchCard(cardId: string, signal?: AbortSignal): Promise<BrixCard | null> {
  const { data } = await directRequest<unknown>(DIRECT_ENDPOINTS.cardApi, {
    method: 'GET',
    query: { route: `${CARD_API_ROUTES.detail}${encodeURIComponent(cardId)}` },
    signal,
  });
  return normaliseCard(data);
}

/**
 * Issuance quote — the authoritative source of the card issuance fee.
 * `0.081 BRIX` is a live value observed from /funding-config.php; the quote
 * endpoint may return the same or a per-user value, so the quote always wins.
 */
export async function fetchCardIssuanceQuote(signal?: AbortSignal): Promise<CardIssuanceQuote | null> {
  const { data } = await directRequest<unknown>(DIRECT_ENDPOINTS.cardIssuanceQuote, {
    method: 'GET',
    signal,
  });
  if (!data || typeof data !== 'object') return null;
  const q = data as Record<string, unknown>;
  return {
    cardIssuanceFeeBrix: (pick(q, 'card_issuance_fee_brix', 'issuance_fee', 'fee') ?? null) as
      | string
      | number
      | null,
    transactionFeeBrix: (pick(q, 'transaction_fee_brix', 'transaction_fee') ?? null) as
      | string
      | number
      | null,
    raw: q,
  };
}

export async function createCard(): Promise<BrixCard | null> {
  const { data } = await directRequest<unknown>(DIRECT_ENDPOINTS.cardApi, {
    method: 'POST',
    body: { route: CARD_API_ROUTES.list, action: 'create' },
    // Issuance debits a fee: it is absolutely a state-changing request.
    idempotency: true,
  });
  return normaliseCard(data);
}

export async function setCardFrozen(cardId: string, frozen: boolean): Promise<unknown> {
  const { data } = await directRequest<unknown>(DIRECT_ENDPOINTS.cardApi, {
    method: 'POST',
    body: {
      route: `${CARD_API_ROUTES.detail}${encodeURIComponent(cardId)}`,
      action: frozen ? 'freeze' : 'unfreeze',
    },
  });
  return data;
}

export type CardToCardArgs = {
  recipientCardId: string;
  amount: string;
  note?: string;
  sourceCardId?: string;
};

export type CardToCardResult = {
  reference?: string;
  status?: string;
  raw: unknown;
};

/**
 * Card-to-card transfer — /card-to-card.php with { recipient_card_id, ... },
 * matching the web client's exact body. The backend validates the recipient;
 * the client NEVER assumes a recipient is valid. `RECIPIENT_CARD_UNVERIFIED`
 * ('Recipient card could not be verified') is surfaced verbatim by the UI.
 */
export async function cardToCard(args: CardToCardArgs): Promise<CardToCardResult> {
  const body: Record<string, unknown> = {
    recipient_card_id: args.recipientCardId.trim(),
    amount: args.amount,
  };
  if (args.note) body.note = args.note;
  if (args.sourceCardId) body.source_card_id = args.sourceCardId;

  if (!body.recipient_card_id) {
    throw new ApiError({
      kind: 'validation',
      message: 'A recipient card is required.',
      code: 'RECIPIENT_REQUIRED',
    });
  }

  const { data } = await directRequest<unknown>(DIRECT_ENDPOINTS.cardToCard, {
    method: 'POST',
    body,
    idempotency: true,
  });

  const root = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  return {
    reference: str(root, 'reference', 'ref', 'transaction_id'),
    status: str(root, 'status', 'state'),
    raw: data,
  };
}
