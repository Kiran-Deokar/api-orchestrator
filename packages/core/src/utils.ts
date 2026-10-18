/**
 * Utility helpers
 */

const SENSITIVE_KEYS = [
  'authorization',
  'password',
  'token',
  'apikey',
  'api_key',
  'api-key',
  'secret',
  'cookie',
  'set-cookie',
  'x-api-key',
  'access_token',
  'refresh_token',
  'bearer',
];

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function mergeHeaders(
  ...headerSets: (Record<string, string> | Headers | undefined)[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const headers of headerSets) {
    if (!headers) continue;
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else {
      Object.assign(result, headers);
    }
  }
  return result;
}

export function buildURL(
  baseURL: string | undefined,
  url: string,
  params?: Record<string, unknown> | URLSearchParams
): string {
  let fullURL: string;

  if (/^https?:\/\//i.test(url)) {
    fullURL = url;
  } else if (baseURL) {
    const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    const path = url.startsWith('/') ? url : `/${url}`;
    fullURL = `${base}${path}`;
  } else {
    fullURL = url;
  }

  if (!params) return fullURL;

  const searchParams =
    params instanceof URLSearchParams
      ? params
      : new URLSearchParams();

  if (!(params instanceof URLSearchParams)) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  }

  const query = searchParams.toString();
  if (!query) return fullURL;

  const separator = fullURL.includes('?') ? '&' : '?';
  return `${fullURL}${separator}${query}`;
}

export function serializeBody(
  data: unknown,
  headers: Record<string, string>
): BodyInit | null | undefined {
  if (data === undefined || data === null) {
    return null;
  }

  // FormData - let browser set Content-Type with boundary
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    // Remove Content-Type so browser sets multipart boundary
    delete headers['Content-Type'];
    delete headers['content-type'];
    return data;
  }

  // URLSearchParams
  if (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams) {
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    return data;
  }

  // Blob / File / ArrayBuffer / TypedArray
  if (
    (typeof Blob !== 'undefined' && data instanceof Blob) ||
    (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) ||
    ArrayBuffer.isView(data)
  ) {
    return data as BodyInit;
  }

  // Already a string
  if (typeof data === 'string') {
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'text/plain';
    }
    return data;
  }

  // Plain object / array → JSON
  if (typeof data === 'object') {
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
    return JSON.stringify(data);
  }

  return String(data);
}

export async function parseResponse(
  response: Response,
  responseType: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'auto'
): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  const status = response.status;

  // 204 No Content or empty body
  if (status === 204 || status === 205) {
    return null;
  }

  // Check content-length
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0') {
    return null;
  }

  try {
    if (responseType === 'json') {
      return await response.json();
    }
    if (responseType === 'text') {
      return await response.text();
    }
    if (responseType === 'blob') {
      return await response.blob();
    }
    if (responseType === 'arrayBuffer') {
      return await response.arrayBuffer();
    }

    // auto
    if (contentType.includes('application/json')) {
      const text = await response.text();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    if (
      contentType.includes('text/') ||
      contentType.includes('application/xml') ||
      contentType.includes('application/javascript')
    ) {
      return await response.text();
    }
    // Default to blob for binary-ish content
    if (
      contentType.includes('octet-stream') ||
      contentType.includes('image/') ||
      contentType.includes('audio/') ||
      contentType.includes('video/') ||
      contentType.includes('application/pdf')
    ) {
      return await response.blob();
    }

    // Fallback: try text then empty
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (err) {
    // Parsing failed – return null for empty, otherwise throw later
    return null;
  }
}

export function redactSensitive(
  obj: Record<string, unknown>,
  extraKeys: string[] = []
): Record<string, unknown> {
  const keys = new Set(
    [...SENSITIVE_KEYS, ...extraKeys].map((k) => k.toLowerCase())
  );
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (keys.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = redactSensitive(value as Record<string, unknown>, extraKeys);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitter: boolean
): number {
  const exp = Math.min(maxDelay, baseDelay * Math.pow(2, attempt));
  if (!jitter) return exp;
  // Full jitter
  return Math.floor(Math.random() * exp);
}

export function getRetryAfter(headers: Headers): number | undefined {
  const retryAfter = headers.get('retry-after');
  if (!retryAfter) return undefined;
  const seconds = Number(retryAfter);
  if (!Number.isNaN(seconds)) {
    return seconds * 1000;
  }
  // HTTP date
  const date = Date.parse(retryAfter);
  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }
  return undefined;
}

export function defaultValidateStatus(status: number): boolean {
  return status >= 200 && status < 300;
}

export function isIdempotentMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === 'GET' || m === 'HEAD' || m === 'OPTIONS' || m === 'PUT' || m === 'DELETE';
}
