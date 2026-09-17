import { useCallback } from 'react';
import { fetchRate, fetchFundingConfig } from '../services/rates';
import type { FundingConfig, RateQuote, Sourced } from '../api/types';
import { useAsync, type AsyncState } from './useAsync';
import { useUiStore } from '../state/uiStore';

/**
 * Live local reference rate for the currently selected currency.
 *
 * Re-fetches whenever the user changes currency, so the dashboard always shows
 * 1 BRIX = N <selected currency> rather than a stale value for a previous one.
 */
export function useRate(currencyOverride?: string): AsyncState<Sourced<RateQuote>> {
  const storeCurrency = useUiStore((s) => s.currency);
  const currency = currencyOverride ?? storeCurrency;

  const loader = useCallback(
    (signal: AbortSignal) => fetchRate(currency, signal),
    [currency],
  );

  // fetchRate already degrades to a labelled fallback instead of throwing, so a
  // failed live call surfaces as `source: 'fallback'` rather than an error view.
  return useAsync(loader, [currency]);
}

/** Fees, USDC wallet, Sheba and the USD reference — always from the backend. */
export function useFundingConfig(): AsyncState<Sourced<FundingConfig>> {
  const loader = useCallback((signal: AbortSignal) => fetchFundingConfig(signal), []);
  return useAsync(loader, []);
}
