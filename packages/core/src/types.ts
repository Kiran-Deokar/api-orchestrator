/**
 * Core types for api-orchestrator
 */

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export type AuthType = 'bearer' | 'apiKey' | 'basic' | 'custom' | 'none';

export interface AuthConfig {
  type: AuthType;
  /** Dynamic token provider - called for each request */
  getToken?: () => string | Promise<string | null | undefined>;
  /** API key value or provider */
  apiKey?: string | (() => string | Promise<string>);
  /** Header name for API key (default: X-API-Key) */
  apiKeyHeader?: string;
  /** Basic auth username */
  username?: string;
  /** Basic auth password */
  password?: string;
  /** Custom header name for auth */
  headerName?: string;
  /** Custom auth value provider */
  getAuthHeader?: () => string | Promise<string>;
  /** Token refresh function */
  refreshToken?: () => Promise<string | null>;
  /** Called on 401 before refresh */
  onUnauthorized?: (error: ApiErrorLike) => void | Promise<void>;
}

export interface RetryConfig {
  /** Maximum number of retry attempts (default: 0) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 300) */
  baseDelay?: number;
  /** Maximum delay in ms (default: 30000) */
  maxDelay?: number;
  /** Add random jitter (default: true) */
  jitter?: boolean;
  /** HTTP status codes that should be retried */
  retryStatusCodes?: number[];
  /** Retry on network errors (default: true) */
  retryNetworkErrors?: boolean;
  /** Only retry idempotent methods by default */
  retryIdempotentOnly?: boolean;
  /** Custom retry condition */
  shouldRetry?: (error: ApiErrorLike, attempt: number) => boolean | Promise<boolean>;
}

export interface LoggerConfig {
  level?: LogLevel;
  /** Custom logger function */
  logger?: (entry: LogEntry) => void;
  /** Redact sensitive fields */
  redactKeys?: string[];
  /** Keep in-memory history (max entries) */
  historySize?: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  outcome: 'success' | 'error' | 'cancelled' | 'timeout';
  errorCode?: string;
  retryAttempt?: number;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface StatusHandlerContext {
  error: ApiErrorLike;
  response?: Response;
  request: RequestConfig;
  retryAfter?: number;
  client: ApiClientLike;
}

export type StatusHandler = (ctx: StatusHandlerContext) => void | Promise<void>;

export interface StatusHandlers {
  [status: number]: StatusHandler;
  /** Range handlers e.g. '5xx' */
  [range: string]: StatusHandler;
}

export interface RequestConfig {
  url?: string;
  method?: HttpMethod | string;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, unknown> | URLSearchParams;
  data?: unknown;
  body?: BodyInit | null;
  timeout?: number;
  signal?: AbortSignal;
  auth?: AuthConfig | false;
  retry?: RetryConfig | false;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'auto';
  /** Skip default status handlers */
  skipStatusHandlers?: boolean;
  /** Custom status handlers for this request */
  statusHandlers?: StatusHandlers;
  /** Request ID for tracing */
  requestId?: string;
  /** Transform request before send */
  transformRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  /** Transform response data */
  transformResponse?: <T>(data: unknown, response: Response) => T | Promise<T>;
  /** Validate status - return true for success */
  validateStatus?: (status: number) => boolean;
  /** Credentials mode */
  credentials?: RequestCredentials;
  /** Cache mode */
  cache?: RequestCache;
  /** Mode */
  mode?: RequestMode;
  /** On upload progress (XHR only) */
  onUploadProgress?: (progress: ProgressEvent) => void;
  /** On download progress */
  onDownloadProgress?: (progress: ProgressEvent) => void;
  /** Meta data passed through */
  meta?: Record<string, unknown>;
  /** Idempotency key */
  idempotencyKey?: string;
}

export interface ProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
  lengthComputable: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
  requestId: string;
  duration: number;
}

export interface ApiErrorLike {
  name: string;
  message: string;
  code?: string;
  status?: number;
  statusText?: string;
  data?: unknown;
  headers?: Headers | Record<string, string>;
  url?: string;
  method?: string;
  requestId?: string;
  cause?: unknown;
  isApiError: true;
  isCancellation?: boolean;
  isTimeout?: boolean;
  isNetworkError?: boolean;
  isRetryable?: boolean;
  config?: RequestConfig;
}

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  auth?: AuthConfig;
  retry?: RetryConfig;
  logger?: LoggerConfig;
  statusHandlers?: StatusHandlers;
  /** Default response type */
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'auto';
  /** Validate status function */
  validateStatus?: (status: number) => boolean;
  /** Credentials */
  credentials?: RequestCredentials;
  /** Global error handler */
  onError?: (error: ApiErrorLike) => void | Promise<void>;
  /** Request middleware */
  requestMiddleware?: RequestMiddleware[];
  /** Response middleware */
  responseMiddleware?: ResponseMiddleware[];
  /** Error middleware */
  errorMiddleware?: ErrorMiddleware[];
  /** Custom transport */
  transport?: TransportAdapter;
  /** Default params */
  params?: Record<string, unknown>;
}

export type RequestMiddleware = (
  config: RequestConfig
) => RequestConfig | Promise<RequestConfig>;

export type ResponseMiddleware = <T>(
  response: ApiResponse<T>
) => ApiResponse<T> | Promise<ApiResponse<T>>;

export type ErrorMiddleware = (
  error: ApiErrorLike
) => ApiErrorLike | Promise<ApiErrorLike> | never;

export interface TransportAdapter {
  request: <T = unknown>(
    config: ResolvedRequestConfig
  ) => Promise<TransportResponse<T>>;
}

export interface ResolvedRequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: BodyInit | null;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  mode?: RequestMode;
  timeout: number;
  responseType: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'auto';
  onUploadProgress?: (progress: ProgressEvent) => void;
  onDownloadProgress?: (progress: ProgressEvent) => void;
  requestId: string;
}

export interface TransportResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  raw?: Response;
}

export interface ApiClientLike {
  request: <T = unknown>(config: RequestConfig) => Promise<ApiResponse<T>>;
  get: <T = unknown>(url: string, config?: RequestConfig) => Promise<T>;
  post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<T>;
  put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<T>;
  patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<T>;
  delete: <T = unknown>(url: string, config?: RequestConfig) => Promise<T>;
  head: <T = unknown>(url: string, config?: RequestConfig) => Promise<T>;
  options: <T = unknown>(url: string, config?: RequestConfig) => Promise<T>;
  upload: <T = unknown>(
    url: string,
    data: FormData | File | Blob,
    config?: RequestConfig
  ) => Promise<T>;
  getConfig: () => Readonly<ApiClientConfig>;
  setHeader: (key: string, value: string) => void;
  removeHeader: (key: string) => void;
  setAuth: (auth: AuthConfig) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => () => void;
}

export interface UploadConfig extends RequestConfig {
  fieldName?: string;
  extraFields?: Record<string, string | Blob>;
  maxSize?: number;
  allowedTypes?: string[];
}
