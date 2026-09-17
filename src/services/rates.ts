import { directRequest } from '../api/client';
import { DIRECT_ENDPOINTS } from '../api/endpoints';
import { ApiError, toApiError } from '../api/ApiError';
import type { FundingConfig, RateQuote, Sourced } from '../api/types';
import {
  FALLBACK_BRIX_USD_REFERENCE,
  FALLBACK_FEES,
  FALLBACK_RATES,
} from '../config/fallback';

/**
 * Rates and fees are NEVER hardcoded as truth.
 *
 *   /rate-engine.php?currency=XX  -> 1 BRIX = brix_local <currency>
 *   /funding-config.php           -> fees, USDC wallet, Sheba, USD reference
 *
 * The constants in config/fallback.ts are used only when the live call fails,
 * and the result is tagged `source: 'fallback'` so the UI can say so out loud.
 */

export async function fetchRate(
  currency: string,
  signal?: AbortSignal,
): Promise<Sourced<RateQuote>> {
  const fetchedAt = new Date().toISOString();
  try {
    const { data } = await directRequest<RateQuote>(DIRECT_ENDPOINTS.rateEngine, {
      method: 'GET',
      query: { currency },
      auth: false,
      signal,
    });

    if (!data || typeof data.brix_local !== 'number' || !Number.isFinite(data.brix_local)) {
      throw new ApiError({
        kind: 'server',
        message: 'The rate engine returned an unexpected payload.',
        code: 'RATE_SHAPE',
      });
    }

    return {
      data: { ...data, currency: data.currency ?? currency },
      source: 'live',
      fetchedAt,
    };
  } catch (error) {
    const fallback = FALLBACK_RATES[currency.toUpperCase()];
    if (fallback === undefined) throw toApiError(error);
    return {
      data: {
        currency: currency.toUpperCase(),
        brix_local: fallback,
        unit: currency.toUpperCase(),
        source: 'Offline fallback',
        status: 'OFFLINE',
        updated_at: fetchedAt,
        stale: true,
        methodology:
          'Offline fallback constant. The live BRIX local reference could not be retrieved.',
      },
      source: 'fallback',
      fetchedAt,
      reason: toApiError(error).message,
    };
  }
}

export async function fetchFundingConfig(
  signal?: AbortSignal,
): Promise<Sourced<FundingConfig>> {
  const fetchedAt = new Date().toISOString();
  try {
    const { data } = await directRequest<FundingConfig>(DIRECT_ENDPOINTS.fundingConfig, {
      method: 'GET',
      auth: false,
      signal,
    });
    return { data, source: 'live', fetchedAt };
  } catch (error) {
    return {
      data: {
        iran_sheba: '',
        bale_app_url: 'https://bale.ai/dl',
        brix_usd_reference: FALLBACK_BRIX_USD_REFERENCE,
        card_issuance_fee_brix: FALLBACK_FEES.cardIssuanceFeeBrix,
        transaction_fee_brix: FALLBACK_FEES.transactionFeeBrix,
        usdc_wallet: '',
      },
      source: 'fallback',
      fetchedAt,
      reason: toApiError(error).message,
    };
  }
}

/**
 * Region bootstrap. `/local-context.php` is served with `credentials:
 * 'same-origin'` by the web client; a failure here is non-fatal because the
 * device locale is a perfectly good fallback.
 */
export type LocalContext = {
  currency?: string;
  language?: string;
  country?: string;
  [key: string]: unknown;
};

export async function fetchLocalContext(signal?: AbortSignal): Promise<LocalContext | null> {
  try {
    const { data } = await directRequest<LocalContext>(DIRECT_ENDPOINTS.localContext, {
      method: 'GET',
      auth: false,
      signal,
    });
    return data ?? null;
  } catch {
    return null;
  }
}

/** Convenience: resolve the local reference rate into a plain number. */
export async function fetchRateNumber(
  currency: string,
  signal?: AbortSignal,
): Promise<{ rate: number | null; source: Sourced<RateQuote>['source'] }> {
  try {
    const sourced = await fetchRate(currency, signal);
    return { rate: sourced.data.brix_local ?? null, source: sourced.source };
  } catch {
    return { rate: null, source: 'fallback' };
  }
}
