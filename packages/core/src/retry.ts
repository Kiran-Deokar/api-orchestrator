import type { ApiErrorLike, RetryConfig } from './types';
import { calculateBackoff, isIdempotentMethod, sleep } from './utils';
import { isApiCancellationError } from './errors';

export const DEFAULT_RETRY_CONFIG: Required<
  Omit<RetryConfig, 'shouldRetry'>
> & { shouldRetry?: RetryConfig['shouldRetry'] } = {
  maxRetries: 0,
  baseDelay: 300,
  maxDelay: 30000,
  jitter: true,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  retryNetworkErrors: true,
  retryIdempotentOnly: true,
};

export function resolveRetryConfig(
  global?: RetryConfig | false,
  local?: RetryConfig | false
): RetryConfig | false {
  if (local === false) return false;
  if (global === false && local === undefined) return false;
  return {
    ...DEFAULT_RETRY_CONFIG,
    ...(typeof global === 'object' ? global : {}),
    ...(typeof local === 'object' ? local : {}),
  };
}

export function shouldRetryRequest(
  error: ApiErrorLike,
  attempt: number,
  method: string,
  config: RetryConfig
): boolean {
  if (isApiCancellationError(error)) return false;
  if (attempt >= (config.maxRetries ?? 0)) return false;

  if (config.shouldRetry) {
    // Custom predicate takes precedence – caller must return boolean
    // We handle async in the client loop
    return true; // actual check done async
  }

  if (config.retryIdempotentOnly !== false && !isIdempotentMethod(method)) {
    return false;
  }

  if (error.isNetworkError && config.retryNetworkErrors !== false) {
    return true;
  }

  if (error.isTimeout) {
    return true;
  }

  if (error.status && config.retryStatusCodes?.includes(error.status)) {
    return true;
  }

  return false;
}

export async function waitForRetry(
  attempt: number,
  config: RetryConfig,
  retryAfterMs?: number,
  signal?: AbortSignal
): Promise<void> {
  let delay: number;
  if (retryAfterMs != null && retryAfterMs > 0) {
    delay = retryAfterMs;
  } else {
    delay = calculateBackoff(
      attempt,
      config.baseDelay ?? 300,
      config.maxDelay ?? 30000,
      config.jitter !== false
    );
  }
  await sleep(delay, signal);
}
