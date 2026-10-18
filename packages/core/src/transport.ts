import type {
  ProgressEvent,
  ResolvedRequestConfig,
  TransportAdapter,
  TransportResponse,
} from './types';
import { parseResponse } from './utils';
import {
  createCancellationError,
  createNetworkError,
  createTimeoutError,
} from './errors';

/**
 * Default Fetch-based transport.
 * Upload progress is not available with pure Fetch;
 * use XHR transport when progress is required.
 */
export class FetchTransport implements TransportAdapter {
  async request<T = unknown>(
    config: ResolvedRequestConfig
  ): Promise<TransportResponse<T>> {
    // Fast-fail if the caller already aborted
    if (config.signal?.aborted) {
      throw createCancellationError(
        'Request was cancelled',
        undefined,
        config.requestId
      );
    }

    const timeoutController = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;

    // Bridge user signal → timeout controller when AbortSignal.any is missing
    if (config.signal) {
      if (config.signal.aborted) {
        timeoutController.abort();
      } else {
        config.signal.addEventListener(
          'abort',
          () => timeoutController.abort(),
          { once: true }
        );
      }
    }

    if (config.timeout > 0) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        timeoutController.abort();
      }, config.timeout);
    }

    // Prefer AbortSignal.any when available so both user abort and timeout work
    const signal: AbortSignal =
      config.signal && typeof AbortSignal.any === 'function'
        ? AbortSignal.any([config.signal, timeoutController.signal])
        : timeoutController.signal;

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal,
        credentials: config.credentials,
        cache: config.cache,
        mode: config.mode,
      });

      if (timeoutId) clearTimeout(timeoutId);

      const data = (await parseResponse(
        response,
        config.responseType
      )) as T;

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        raw: response,
      };
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);

      const isAbort =
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError') ||
        (typeof err === 'object' &&
          err !== null &&
          (err as { name?: string }).name === 'AbortError');

      if (isAbort) {
        // User cancellation takes priority over timeout
        if (config.signal?.aborted && !timedOut) {
          throw createCancellationError(
            'Request was cancelled',
            undefined,
            config.requestId
          );
        }
        if (timedOut || !config.signal?.aborted) {
          throw createTimeoutError(
            config.timeout,
            undefined,
            config.requestId
          );
        }
        throw createCancellationError(
          'Request was cancelled',
          undefined,
          config.requestId
        );
      }

      throw createNetworkError(err, undefined, config.requestId);
    }
  }
}

/**
 * XHR transport – supports upload progress.
 */
export class XHRTransport implements TransportAdapter {
  async request<T = unknown>(
    config: ResolvedRequestConfig
  ): Promise<TransportResponse<T>> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      xhr.open(config.method, config.url, true);

      // Headers
      for (const [key, value] of Object.entries(config.headers)) {
        // Skip Content-Type for FormData so browser sets boundary
        if (
          (key.toLowerCase() === 'content-type') &&
          config.body instanceof FormData
        ) {
          continue;
        }
        xhr.setRequestHeader(key, value);
      }

      if (config.credentials === 'include') {
        xhr.withCredentials = true;
      }

      // Response type
      if (config.responseType === 'blob') {
        xhr.responseType = 'blob';
      } else if (config.responseType === 'arrayBuffer') {
        xhr.responseType = 'arraybuffer';
      } else if (config.responseType === 'text') {
        xhr.responseType = 'text';
      } else {
        xhr.responseType = 'text'; // parse later
      }

      // Progress
      if (config.onUploadProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          config.onUploadProgress!({
            loaded: e.loaded,
            total: e.total,
            percentage: e.lengthComputable
              ? Math.round((e.loaded / e.total) * 100)
              : 0,
            lengthComputable: e.lengthComputable,
          });
        };
      }

      if (config.onDownloadProgress) {
        xhr.onprogress = (e) => {
          config.onDownloadProgress!({
            loaded: e.loaded,
            total: e.total,
            percentage: e.lengthComputable
              ? Math.round((e.loaded / e.total) * 100)
              : 0,
            lengthComputable: e.lengthComputable,
          });
        };
      }

      // Timeout
      if (config.timeout > 0) {
        xhr.timeout = config.timeout;
        timeoutId = setTimeout(() => {
          xhr.abort();
        }, config.timeout);
      }

      // Abort signal
      const onAbort = () => {
        xhr.abort();
      };
      if (config.signal) {
        if (config.signal.aborted) {
          reject(
            createCancellationError(
              'Request was cancelled',
              undefined,
              config.requestId
            )
          );
          return;
        }
        config.signal.addEventListener('abort', onAbort, { once: true });
      }

      xhr.onload = () => {
        if (timeoutId) clearTimeout(timeoutId);
        config.signal?.removeEventListener('abort', onAbort);

        const headers = new Headers();
        const rawHeaders = xhr.getAllResponseHeaders().trim().split(/[\r\n]+/);
        for (const line of rawHeaders) {
          const parts = line.split(': ');
          const key = parts.shift();
          if (key) headers.set(key, parts.join(': '));
        }

        let data: unknown = xhr.response;
        if (
          config.responseType === 'json' ||
          config.responseType === 'auto'
        ) {
          const ct = headers.get('content-type') || '';
          if (
            config.responseType === 'json' ||
            ct.includes('application/json')
          ) {
            try {
              data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            } catch {
              data = xhr.responseText;
            }
          }
        }

        resolve({
          data: data as T,
          status: xhr.status,
          statusText: xhr.statusText,
          headers,
        });
      };

      xhr.onerror = () => {
        if (timeoutId) clearTimeout(timeoutId);
        config.signal?.removeEventListener('abort', onAbort);
        reject(
          createNetworkError(
            new Error('Network request failed'),
            undefined,
            config.requestId
          )
        );
      };

      xhr.ontimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        config.signal?.removeEventListener('abort', onAbort);
        reject(
          createTimeoutError(config.timeout, undefined, config.requestId)
        );
      };

      xhr.onabort = () => {
        if (timeoutId) clearTimeout(timeoutId);
        config.signal?.removeEventListener('abort', onAbort);
        if (config.signal?.aborted) {
          reject(
            createCancellationError(
              'Request was cancelled',
              undefined,
              config.requestId
            )
          );
        } else {
          reject(
            createTimeoutError(config.timeout, undefined, config.requestId)
          );
        }
      };

      xhr.send(config.body as XMLHttpRequestBodyInit | null);
    });
  }
}

export function createDefaultTransport(): TransportAdapter {
  return new FetchTransport();
}
