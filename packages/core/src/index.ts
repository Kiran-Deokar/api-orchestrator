/**
 * api-orchestrator
 * Configure once. Use everywhere.
 */

export { createApiClient, ApiClient } from './client';
export {
  ApiError,
  isApiError,
  isApiCancellationError,
  isApiTimeoutError,
  isApiNetworkError,
  createCancellationError,
  createTimeoutError,
  createNetworkError,
  createHttpError,
  normalizeError,
} from './errors';
export { Logger } from './logger';
export { FetchTransport, XHRTransport, createDefaultTransport } from './transport';
export { applyAuth, coordinatedRefresh } from './auth';
export {
  resolveRetryConfig,
  shouldRetryRequest,
  waitForRetry,
  DEFAULT_RETRY_CONFIG,
} from './retry';
export {
  generateRequestId,
  mergeHeaders,
  buildURL,
  serializeBody,
  parseResponse,
  redactSensitive,
  sleep,
  calculateBackoff,
  getRetryAfter,
  defaultValidateStatus,
  isIdempotentMethod,
} from './utils';

export type {
  HttpMethod,
  LogLevel,
  AuthType,
  AuthConfig,
  RetryConfig,
  LoggerConfig,
  LogEntry,
  StatusHandlerContext,
  StatusHandler,
  StatusHandlers,
  RequestConfig,
  ProgressEvent,
  ApiResponse,
  ApiErrorLike,
  ApiClientConfig,
  RequestMiddleware,
  ResponseMiddleware,
  ErrorMiddleware,
  TransportAdapter,
  ResolvedRequestConfig,
  TransportResponse,
  ApiClientLike,
  UploadConfig,
} from './types';
