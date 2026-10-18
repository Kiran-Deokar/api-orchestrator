import type { ApiErrorLike, RequestConfig } from './types';

export class ApiError extends Error implements ApiErrorLike {
  readonly isApiError = true as const;
  readonly name = 'ApiError';
  code?: string;
  status?: number;
  statusText?: string;
  data?: unknown;
  headers?: Headers | Record<string, string>;
  url?: string;
  method?: string;
  requestId?: string;
  cause?: unknown;
  isCancellation?: boolean;
  isTimeout?: boolean;
  isNetworkError?: boolean;
  isRetryable?: boolean;
  config?: RequestConfig;

  constructor(
    message: string,
    options: Partial<Omit<ApiErrorLike, 'name' | 'message' | 'isApiError'>> = {}
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);

    this.code = options.code;
    this.status = options.status;
    this.statusText = options.statusText;
    this.data = options.data;
    this.headers = options.headers;
    this.url = options.url;
    this.method = options.method;
    this.requestId = options.requestId;
    this.cause = options.cause;
    this.isCancellation = options.isCancellation ?? false;
    this.isTimeout = options.isTimeout ?? false;
    this.isNetworkError = options.isNetworkError ?? false;
    this.isRetryable = options.isRetryable ?? false;
    this.config = options.config;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      statusText: this.statusText,
      data: this.data,
      url: this.url,
      method: this.method,
      requestId: this.requestId,
      isCancellation: this.isCancellation,
      isTimeout: this.isTimeout,
      isNetworkError: this.isNetworkError,
      isRetryable: this.isRetryable,
    };
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError ||
    (typeof error === 'object' &&
      error !== null &&
      (error as ApiErrorLike).isApiError === true)
  );
}

export function isApiCancellationError(error: unknown): boolean {
  return isApiError(error) && error.isCancellation === true;
}

export function isApiTimeoutError(error: unknown): boolean {
  return isApiError(error) && error.isTimeout === true;
}

export function isApiNetworkError(error: unknown): boolean {
  return isApiError(error) && error.isNetworkError === true;
}

export function createCancellationError(
  message = 'Request was cancelled',
  config?: RequestConfig,
  requestId?: string
): ApiError {
  return new ApiError(message, {
    code: 'ERR_CANCELED',
    isCancellation: true,
    isRetryable: false,
    config,
    requestId,
  });
}

export function createTimeoutError(
  timeout: number,
  config?: RequestConfig,
  requestId?: string
): ApiError {
  return new ApiError(`Request timed out after ${timeout}ms`, {
    code: 'ERR_TIMEOUT',
    isTimeout: true,
    isRetryable: true,
    config,
    requestId,
  });
}

export function createNetworkError(
  cause: unknown,
  config?: RequestConfig,
  requestId?: string
): ApiError {
  const message =
    cause instanceof Error ? cause.message : 'Network request failed';
  return new ApiError(message, {
    code: 'ERR_NETWORK',
    isNetworkError: true,
    isRetryable: true,
    cause,
    config,
    requestId,
  });
}

export function createHttpError(
  status: number,
  statusText: string,
  data: unknown,
  headers: Headers,
  config: RequestConfig,
  requestId: string
): ApiError {
  const message =
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof (data as { message: unknown }).message === 'string'
      ? (data as { message: string }).message
      : `Request failed with status ${status}`;

  const isRetryable =
    status === 408 || status === 429 || (status >= 500 && status < 600);

  return new ApiError(message, {
    code: `ERR_HTTP_${status}`,
    status,
    statusText,
    data,
    headers,
    url: config.url,
    method: config.method,
    requestId,
    isRetryable,
    config,
  });
}

export function normalizeError(
  error: unknown,
  config?: RequestConfig,
  requestId?: string
): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return createCancellationError('Request aborted', config, requestId);
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.message.includes('aborted')) {
      return createCancellationError(error.message, config, requestId);
    }
    return createNetworkError(error, config, requestId);
  }

  return new ApiError(String(error), {
    code: 'ERR_UNKNOWN',
    cause: error,
    config,
    requestId,
  });
}
