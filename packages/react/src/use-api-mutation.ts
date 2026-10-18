import { useCallback, useRef, useState } from 'react';
import type { ApiError, HttpMethod, RequestConfig } from 'api-orchestrator';
import { isApiCancellationError } from 'api-orchestrator';
import { useApiClient } from './provider';

export interface UseApiMutationOptions<TData, TVariables> {
  method?: HttpMethod | string;
  url?: string | ((variables: TVariables) => string);
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: ApiError, variables: TVariables) => void;
  onSettled?: (
    data: TData | undefined,
    error: ApiError | null,
    variables: TVariables
  ) => void;
  /** Extra request config */
  requestConfig?: RequestConfig;
}

export interface UseApiMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | undefined>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | undefined;
  error: ApiError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
  cancel: () => void;
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  options: UseApiMutationOptions<TData, TVariables> = {}
): UseApiMutationResult<TData, TVariables> {
  const client = useApiClient();
  const {
    method = 'POST',
    url,
    onSuccess,
    onError,
    onSettled,
    requestConfig,
  } = options;

  const [data, setData] = useState<TData | undefined>();
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setIsLoading(false);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const resolvedUrl =
          typeof url === 'function' ? url(variables) : url || '';
        const m = (method || 'POST').toUpperCase();

        let result: TData;
        if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS' || m === 'DELETE') {
          result = await client.requestFull<TData>({
            ...requestConfig,
            url: resolvedUrl,
            method: m,
            signal: controller.signal,
            data: variables as unknown,
          }).then((r) => r.data);
        } else {
          result = await client.requestFull<TData>({
            ...requestConfig,
            url: resolvedUrl,
            method: m,
            data: variables,
            signal: controller.signal,
          }).then((r) => r.data);
        }

        setData(result);
        setIsLoading(false);
        onSuccess?.(result, variables);
        onSettled?.(result, null, variables);
        return result;
      } catch (err) {
        if (isApiCancellationError(err)) {
          setIsLoading(false);
          throw err;
        }
        const apiErr = err as ApiError;
        setError(apiErr);
        setIsLoading(false);
        onError?.(apiErr, variables);
        onSettled?.(undefined, apiErr, variables);
        throw apiErr;
      }
    },
    [client, method, url, requestConfig, onSuccess, onError, onSettled]
  );

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | undefined> => {
      try {
        return await mutateAsync(variables);
      } catch {
        return undefined;
      }
    },
    [mutateAsync]
  );

  return {
    mutate,
    mutateAsync,
    data,
    error,
    isLoading,
    isSuccess: !isLoading && !error && data !== undefined,
    isError: !!error,
    reset,
    cancel,
  };
}
