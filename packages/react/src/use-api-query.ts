import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiError, RequestConfig } from 'api-orchestrator';
import { isApiCancellationError } from 'api-orchestrator';
import { useApiClient } from './provider';

export interface UseApiQueryOptions<T> extends RequestConfig {
  /** Disable automatic fetch */
  enabled?: boolean;
  /** Refetch on mount */
  refetchOnMount?: boolean;
  /** Called on success */
  onSuccess?: (data: T) => void;
  /** Called on error */
  onError?: (error: ApiError) => void;
  /** Initial data */
  initialData?: T;
}

export interface UseApiQueryResult<T> {
  data: T | undefined;
  error: ApiError | null;
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  refetch: () => Promise<T | undefined>;
  cancel: () => void;
}

export function useApiQuery<T = unknown>(
  url: string,
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const client = useApiClient();
  const {
    enabled = true,
    refetchOnMount = true,
    onSuccess,
    onError,
    initialData,
    ...requestConfig
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(enabled && !initialData);
  const [isFetching, setIsFetching] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async (): Promise<T | undefined> => {
    // Cancel previous
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const thisRequestId = ++requestIdRef.current;

    setIsFetching(true);
    setError(null);
    if (!data) setIsLoading(true);

    try {
      const result = await client.get<T>(url, {
        ...requestConfig,
        signal: controller.signal,
      });

      // Stale response protection
      if (!mountedRef.current || thisRequestId !== requestIdRef.current) {
        return undefined;
      }

      setData(result);
      setIsLoading(false);
      setIsFetching(false);
      onSuccess?.(result);
      return result;
    } catch (err) {
      if (!mountedRef.current || thisRequestId !== requestIdRef.current) {
        return undefined;
      }
      if (isApiCancellationError(err)) {
        setIsLoading(false);
        setIsFetching(false);
        return undefined;
      }
      const apiErr = err as ApiError;
      setError(apiErr);
      setIsLoading(false);
      setIsFetching(false);
      onError?.(apiErr);
      return undefined;
    }
  }, [client, url, requestConfig, onSuccess, onError, data]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled && refetchOnMount) {
      void fetchData();
    }
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, url]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    data,
    error,
    isLoading,
    isFetching,
    isSuccess: !isLoading && !error && data !== undefined,
    isError: !!error,
    refetch: fetchData,
    cancel,
  };
}
