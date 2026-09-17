import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, toApiError } from '../api/ApiError';

export type AsyncState<T> = {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  refreshing: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  setData: (next: T | null) => void;
};

/**
 * The one data-loading primitive every screen uses.
 *
 * Guarantees, so no screen ever silently does nothing:
 *   - `loading` true on first load, `refreshing` true on pull-to-refresh
 *   - every failure becomes a typed ApiError (never an unhandled rejection)
 *   - results from a stale mount are discarded (no setState-after-unmount)
 *   - `reload` is stable, so it can be passed straight to a retry button
 */
export function useAsync<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
  options: { skip?: boolean } = {},
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(!options.skip);
  const [refreshing, setRefreshing] = useState(false);

  const mounted = useRef(true);
  const loaderRef = useRef(loader);
  const skip = options.skip ?? false;

  loaderRef.current = loader;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (skip) {
        setLoading(false);
        return;
      }
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);

      const controller = new AbortController();
      try {
        const result = await loaderRef.current(controller.signal);
        if (!mounted.current) return;
        setData(result);
      } catch (e) {
        if (!mounted.current) return;
        const apiError = toApiError(e);
        // A caller-initiated cancel is not a failure worth surfacing.
        if (apiError.code !== 'CANCELLED') setError(apiError);
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [skip],
  );

  useEffect(() => {
    void run('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = useCallback(() => run('initial'), [run]);
  const refresh = useCallback(() => run('refresh'), [run]);

  return useMemo(
    () => ({ data, error, loading, refreshing, reload, refresh, setData }),
    [data, error, loading, refreshing, reload, refresh],
  );
}

export type MutationState<TArgs, TResult> = {
  submit: (args: TArgs) => Promise<TResult | null>;
  loading: boolean;
  error: ApiError | null;
  result: TResult | null;
  reset: () => void;
};

/**
 * Write operations (send, card-to-card, fund, pay, issue card).
 *
 * Two independent guards against a double charge:
 *   1. `loading` is set synchronously before the await, and screens bind
 *      `disabled={mutation.loading}`.
 *   2. A ref latch rejects a second concurrent call even if the button was
 *      somehow pressed twice inside one frame.
 */
export function useMutation<TArgs, TResult>(
  action: (args: TArgs) => Promise<TResult>,
): MutationState<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<TResult | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const submit = useCallback(
    async (args: TArgs): Promise<TResult | null> => {
      if (inFlight.current) return null;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      try {
        const value = await action(args);
        if (mounted.current) setResult(value);
        return value;
      } catch (e) {
        if (mounted.current) setError(toApiError(e));
        return null;
      } finally {
        inFlight.current = false;
        if (mounted.current) setLoading(false);
      }
    },
    [action],
  );

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return { submit, loading, error, result, reset };
}
