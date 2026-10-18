import type {
  ApiClientConfig,
  ApiClientLike,
  ApiResponse,
  RequestConfig,
  ResolvedRequestConfig,
  StatusHandlerContext,
  StatusHandlers,
  TransportAdapter,
  UploadConfig,
} from './types';
import {
  ApiError,
  createHttpError,
  isApiCancellationError,
  normalizeError,
} from './errors';
import { applyAuth, coordinatedRefresh } from './auth';
import { Logger } from './logger';
import {
  resolveRetryConfig,
  shouldRetryRequest,
  waitForRetry,
} from './retry';
import { createDefaultTransport, XHRTransport } from './transport';
import {
  buildURL,
  defaultValidateStatus,
  generateRequestId,
  getRetryAfter,
  mergeHeaders,
  serializeBody,
} from './utils';

type EventHandler = (...args: unknown[]) => void;

export class ApiClient implements ApiClientLike {
  private config: ApiClientConfig;
  private logger: Logger;
  private transport: TransportAdapter;
  private eventHandlers = new Map<string, Set<EventHandler>>();
  private headers: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.config = { ...config };
    this.headers = { ...(config.headers || {}) };
    this.logger = new Logger(config.logger);
    this.transport = config.transport || createDefaultTransport();
  }

  getConfig(): Readonly<ApiClientConfig> {
    return { ...this.config, headers: { ...this.headers } };
  }

  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  removeHeader(key: string): void {
    delete this.headers[key];
  }

  setAuth(auth: ApiClientConfig['auth']): void {
    this.config.auth = auth;
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  private emit(event: string, ...args: unknown[]): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) return;
    for (const h of handlers) {
      try {
        h(...args);
      } catch {
        // Event handler errors must not affect request
      }
    }
  }

  async request<T = unknown>(
    requestConfig: RequestConfig
  ): Promise<ApiResponse<T>> {
    const start = Date.now();
    const requestId = requestConfig.requestId || generateRequestId();
    let attempt = 0;

    const retryConfig = resolveRetryConfig(
      this.config.retry,
      requestConfig.retry
    );

    // Merge config
    let config: RequestConfig = {
      ...requestConfig,
      requestId,
      baseURL: requestConfig.baseURL ?? this.config.baseURL,
      timeout: requestConfig.timeout ?? this.config.timeout ?? 30000,
      responseType:
        requestConfig.responseType ?? this.config.responseType ?? 'auto',
      credentials:
        requestConfig.credentials ?? this.config.credentials ?? 'same-origin',
      validateStatus:
        requestConfig.validateStatus ??
        this.config.validateStatus ??
        defaultValidateStatus,
      headers: mergeHeaders(this.headers, requestConfig.headers),
      params: {
        ...(this.config.params || {}),
        ...(requestConfig.params || {}),
      },
    };

    // Apply request middleware
    if (this.config.requestMiddleware) {
      for (const mw of this.config.requestMiddleware) {
        config = await mw(config);
      }
    }

    // Transform request
    if (config.transformRequest) {
      config = await config.transformRequest(config);
    }

    this.emit('request', config);

    while (true) {
      try {
        const result = await this.executeRequest<T>(config, attempt);
        const duration = Date.now() - start;

        this.logger.log({
          id: requestId,
          timestamp: Date.now(),
          level: 'info',
          method: config.method || 'GET',
          url: result.config.url || '',
          status: result.status,
          duration,
          outcome: 'success',
          retryAttempt: attempt > 0 ? attempt : undefined,
        });

        this.emit('response', result);
        return result;
      } catch (err) {
        const error = normalizeError(err, config, requestId);

        // Status handlers
        if (
          error.status &&
          !config.skipStatusHandlers &&
          !isApiCancellationError(error)
        ) {
          await this.runStatusHandlers(error, config);
        }

        // Retry logic
        const method = (config.method || 'GET').toUpperCase();
        let canRetry = false;

        if (retryConfig !== false) {
          if (retryConfig.shouldRetry) {
            canRetry = await retryConfig.shouldRetry(error, attempt);
          } else {
            canRetry = shouldRetryRequest(error, attempt, method, retryConfig);
          }
        }

        if (canRetry && retryConfig !== false) {
          attempt++;
          const retryAfter = error.headers
            ? getRetryAfter(error.headers as Headers)
            : undefined;

          this.logger.log({
            id: requestId,
            timestamp: Date.now(),
            level: 'warn',
            method,
            url: config.url || '',
            status: error.status,
            outcome: 'error',
            errorCode: error.code,
            retryAttempt: attempt,
            message: `Retrying (${attempt}/${retryConfig.maxRetries})`,
          });

          this.emit('retry', { attempt, error, config });

          try {
            await waitForRetry(
              attempt - 1,
              retryConfig,
              retryAfter,
              config.signal
            );
          } catch {
            // Aborted during wait
            throw normalizeError(
              new DOMException('Aborted', 'AbortError'),
              config,
              requestId
            );
          }
          continue;
        }

        // Final error path
        const duration = Date.now() - start;
        const outcome = isApiCancellationError(error)
          ? 'cancelled'
          : error.isTimeout
            ? 'timeout'
            : 'error';

        this.logger.log({
          id: requestId,
          timestamp: Date.now(),
          level: 'error',
          method: config.method || 'GET',
          url: config.url || '',
          status: error.status,
          duration,
          outcome,
          errorCode: error.code,
          retryAttempt: attempt > 0 ? attempt : undefined,
          message: error.message,
        });

        // Error middleware
        let finalError = error;
        if (this.config.errorMiddleware) {
          for (const mw of this.config.errorMiddleware) {
            finalError = (await mw(finalError)) as ApiError;
          }
        }

        this.emit('error', finalError);

        if (this.config.onError && !isApiCancellationError(finalError)) {
          try {
            await this.config.onError(finalError);
          } catch {
            // onError must not throw into the request path
          }
        }

        throw finalError;
      }
    }
  }

  private async executeRequest<T>(
    config: RequestConfig,
    _attempt: number
  ): Promise<ApiResponse<T>> {
    // Apply auth (dynamic token)
    const authed = await applyAuth(config, this.config.auth);

    // Handle 401 refresh once
    // (refresh is triggered in status handler / after first 401)

    const url = buildURL(authed.baseURL, authed.url || '', authed.params);
    const headers = { ...(authed.headers || {}) };

    // Idempotency key
    if (authed.idempotencyKey) {
      headers['Idempotency-Key'] = authed.idempotencyKey;
    }

    // Serialize body
    let body: BodyInit | null | undefined;
    if (authed.body !== undefined) {
      body = authed.body;
    } else if (authed.data !== undefined) {
      body = serializeBody(authed.data, headers);
    }

    const resolved: ResolvedRequestConfig = {
      url,
      method: (authed.method || 'GET').toUpperCase(),
      headers,
      body,
      signal: authed.signal,
      credentials: authed.credentials,
      cache: authed.cache,
      mode: authed.mode,
      timeout: authed.timeout ?? 30000,
      responseType: authed.responseType ?? 'auto',
      onUploadProgress: authed.onUploadProgress,
      onDownloadProgress: authed.onDownloadProgress,
      requestId: authed.requestId!,
    };

    // Choose transport: XHR if upload progress needed
    const transport =
      authed.onUploadProgress && typeof XMLHttpRequest !== 'undefined'
        ? new XHRTransport()
        : this.transport;

    const transportResult = await transport.request<T>(resolved);

    const validate =
      authed.validateStatus ?? this.config.validateStatus ?? defaultValidateStatus;

    if (!validate(transportResult.status)) {
      throw createHttpError(
        transportResult.status,
        transportResult.statusText,
        transportResult.data,
        transportResult.headers,
        { ...authed, url },
        authed.requestId!
      );
    }

    let data = transportResult.data;

    // Transform response
    if (authed.transformResponse) {
      data = await authed.transformResponse(data, transportResult.raw as Response);
    }

    let response: ApiResponse<T> = {
      data: data as T,
      status: transportResult.status,
      statusText: transportResult.statusText,
      headers: transportResult.headers,
      config: { ...authed, url },
      requestId: authed.requestId!,
      duration: 0, // filled by caller
    };

    // Response middleware
    if (this.config.responseMiddleware) {
      for (const mw of this.config.responseMiddleware) {
        response = await mw(response);
      }
    }

    return response;
  }

  private async runStatusHandlers(
    error: ApiError,
    config: RequestConfig
  ): Promise<void> {
    const handlers: StatusHandlers = {
      ...(this.config.statusHandlers || {}),
      ...(config.statusHandlers || {}),
    };

    const status = error.status!;
    const ctx: StatusHandlerContext = {
      error,
      request: config,
      client: this,
      retryAfter: error.headers
        ? getRetryAfter(error.headers as Headers)
        : undefined,
    };

    // Exact status
    if (handlers[status]) {
      try {
        await handlers[status](ctx);
      } catch {
        // Handler errors isolated
      }
      return;
    }

    // Range e.g. 4xx, 5xx
    const rangeKey = `${Math.floor(status / 100)}xx`;
    if (handlers[rangeKey]) {
      try {
        await handlers[rangeKey](ctx);
      } catch {
        // isolated
      }
    }

    // Special 401 refresh coordination
    if (
      status === 401 &&
      this.config.auth?.refreshToken &&
      this.config.auth.type === 'bearer'
    ) {
      try {
        if (this.config.auth.onUnauthorized) {
          await this.config.auth.onUnauthorized(error);
        }
        await coordinatedRefresh(this.config.auth.refreshToken);
      } catch {
        // refresh failed
      }
    }
  }

  // Convenience methods – return data directly for ergonomics
  async get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const res = await this.request<T>({ ...config, url, method: 'GET' });
    return res.data;
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const res = await this.request<T>({
      ...config,
      url,
      method: 'POST',
      data,
    });
    return res.data;
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const res = await this.request<T>({
      ...config,
      url,
      method: 'PUT',
      data,
    });
    return res.data;
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const res = await this.request<T>({
      ...config,
      url,
      method: 'PATCH',
      data,
    });
    return res.data;
  }

  async delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const res = await this.request<T>({ ...config, url, method: 'DELETE' });
    return res.data;
  }

  async head<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const res = await this.request<T>({ ...config, url, method: 'HEAD' });
    return res.data;
  }

  async options<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    const res = await this.request<T>({ ...config, url, method: 'OPTIONS' });
    return res.data;
  }

  /**
   * Upload helper – uses XHR when progress callback is provided.
   */
  async upload<T = unknown>(
    url: string,
    data: FormData | File | Blob,
    config: UploadConfig = {}
  ): Promise<T> {
    let formData: FormData;

    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      const fieldName = config.fieldName || 'file';
      formData.append(fieldName, data);
      if (config.extraFields) {
        for (const [k, v] of Object.entries(config.extraFields)) {
          formData.append(k, v);
        }
      }
    }

    // Client-side validation helpers
    if (config.maxSize || config.allowedTypes) {
      const files: File[] = [];
      formData.forEach((value) => {
        if (value instanceof File) files.push(value);
      });
      for (const file of files) {
        if (config.maxSize && file.size > config.maxSize) {
          throw new ApiError(
            `File "${file.name}" exceeds maximum size of ${config.maxSize} bytes`,
            { code: 'ERR_FILE_TOO_LARGE', isRetryable: false }
          );
        }
        if (
          config.allowedTypes &&
          config.allowedTypes.length > 0 &&
          !config.allowedTypes.some(
            (t) =>
              file.type === t ||
              (t.endsWith('/*') && file.type.startsWith(t.replace('/*', '/')))
          )
        ) {
          throw new ApiError(
            `File type "${file.type}" is not allowed`,
            { code: 'ERR_FILE_TYPE', isRetryable: false }
          );
        }
      }
    }

    const res = await this.request<T>({
      ...config,
      url,
      method: config.method || 'POST',
      data: formData,
    });
    return res.data;
  }

  /**
   * Full response (including status/headers) – useful when metadata is needed.
   */
  async requestFull<T = unknown>(
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(config);
  }
}

/**
 * Create a new API client instance.
 */
export function createApiClient(config?: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
