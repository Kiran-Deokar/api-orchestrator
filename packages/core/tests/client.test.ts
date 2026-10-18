import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createApiClient,
  ApiError,
  isApiError,
  isApiCancellationError,
  isApiTimeoutError,
} from '../src/index';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers({
      'content-type': 'application/json',
      ...headers,
    }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  });
}

describe('createApiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a client with default config', () => {
    const api = createApiClient();
    expect(api).toBeDefined();
    expect(api.getConfig()).toBeDefined();
  });

  it('performs GET request and returns data', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse([{ id: 1, name: 'Alice' }]));

    const api = createApiClient({ baseURL: 'https://api.example.com' });
    const users = await api.get('/users');

    expect(users).toEqual([{ id: 1, name: 'Alice' }]);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.example.com/users');
    expect(init.method).toBe('GET');
  });

  it('performs POST with JSON body', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ id: 2, name: 'Bob' }, 201));

    const api = createApiClient({ baseURL: 'https://api.example.com' });
    const user = await api.post('/users', { name: 'Bob' });

    expect(user).toEqual({ id: 2, name: 'Bob' });
    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ name: 'Bob' }));
  });

  it('supports PUT, PATCH, DELETE', async () => {
    mockFetch
      .mockReturnValueOnce(jsonResponse({ updated: true }))
      .mockReturnValueOnce(jsonResponse({ patched: true }))
      .mockReturnValueOnce(jsonResponse(null, 204));

    const api = createApiClient({ baseURL: 'https://api.example.com' });

    await api.put('/users/1', { name: 'Updated' });
    await api.patch('/users/1', { name: 'Patched' });
    await api.delete('/users/1');

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
    expect(mockFetch.mock.calls[1][1].method).toBe('PATCH');
    expect(mockFetch.mock.calls[2][1].method).toBe('DELETE');
  });

  it('merges query params', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse([]));

    const api = createApiClient({
      baseURL: 'https://api.example.com',
      params: { version: 'v1' },
    });
    await api.get('/users', { params: { page: 1, limit: 10 } });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('version=v1');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=10');
  });

  it('applies default headers and request overrides', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({}));

    const api = createApiClient({
      baseURL: 'https://api.example.com',
      headers: { 'X-Client': 'test' },
    });
    await api.get('/users', { headers: { 'X-Request': '1' } });

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['X-Client']).toBe('test');
    expect(init.headers['X-Request']).toBe('1');
  });

  it('throws ApiError on non-2xx', async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ message: 'Not found' }, 404)
    );

    const api = createApiClient({
      baseURL: 'https://api.example.com',
      logger: { level: 'silent' },
    });

    await expect(api.get('/missing')).rejects.toThrow(ApiError);
  });

  it('normalizes HTTP errors with status and data', async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({ message: 'Validation failed', errors: [] }, 422)
    );

    const api = createApiClient({
      baseURL: 'https://api.example.com',
      logger: { level: 'silent' },
    });

    try {
      await api.post('/users', {});
      expect.fail('should have thrown');
    } catch (err) {
      expect(isApiError(err)).toBe(true);
      const e = err as ApiError;
      expect(e.status).toBe(422);
      expect(e.data).toEqual({ message: 'Validation failed', errors: [] });
      expect(e.message).toContain('Validation failed');
    }
  });

  it('supports cancellation via AbortController', async () => {
    const controller = new AbortController();

    // Mock that respects already-aborted signals and abort events
    mockFetch.mockImplementationOnce((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        const abort = () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        };
        if (signal?.aborted) {
          abort();
          return;
        }
        signal?.addEventListener('abort', abort, { once: true });
      });
    });

    const api = createApiClient({
      baseURL: 'https://api.example.com',
      logger: { level: 'silent' },
      timeout: 2000,
    });

    const promise = api.get('/users', { signal: controller.signal });
    // Allow the request pipeline (auth + fetch mock) to start, then abort
    await new Promise((r) => setTimeout(r, 0));
    controller.abort();

    await expect(promise).rejects.toSatisfy(isApiCancellationError);
  });

  it('supports bearer auth with dynamic token', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ ok: true }));

    const getToken = vi.fn().mockResolvedValue('secret-token');
    const api = createApiClient({
      baseURL: 'https://api.example.com',
      auth: { type: 'bearer', getToken },
    });

    await api.get('/secure');
    expect(getToken).toHaveBeenCalled();
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['Authorization']).toBe('Bearer secret-token');
  });

  it('supports API key auth', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ ok: true }));

    const api = createApiClient({
      baseURL: 'https://api.example.com',
      auth: { type: 'apiKey', apiKey: 'my-key', apiKeyHeader: 'X-API-Key' },
    });

    await api.get('/data');
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers['X-API-Key']).toBe('my-key');
  });

  it('does not JSON-serialize FormData', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ uploaded: true }));

    const api = createApiClient({ baseURL: 'https://api.example.com' });
    const fd = new FormData();
    fd.append('file', new Blob(['hello']), 'test.txt');

    await api.post('/upload', fd);

    const [, init] = mockFetch.mock.calls[0];
    expect(init.body).toBeInstanceOf(FormData);
    // Content-Type should not be forced to application/json
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('handles 204 No Content', async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers(),
        json: () => Promise.reject(new Error('no body')),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      })
    );

    const api = createApiClient({ baseURL: 'https://api.example.com' });
    const result = await api.delete('/users/1');
    expect(result).toBeNull();
  });

  it('supports requestFull for metadata access', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ id: 1 }));

    const api = createApiClient({ baseURL: 'https://api.example.com' });
    const res = await api.requestFull({ url: '/users/1', method: 'GET' });

    expect(res.data).toEqual({ id: 1 });
    expect(res.status).toBe(200);
    expect(res.requestId).toMatch(/^req_/);
    expect(res.headers).toBeInstanceOf(Headers);
  });

  it('runs status handlers on error', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ message: 'Unauthorized' }, 401));

    const handler = vi.fn();
    const api = createApiClient({
      baseURL: 'https://api.example.com',
      logger: { level: 'silent' },
      statusHandlers: {
        401: handler,
      },
    });

    await expect(api.get('/secure')).rejects.toThrow();
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].error.status).toBe(401);
  });

  it('retries on configured status codes', async () => {
    mockFetch
      .mockReturnValueOnce(jsonResponse({ message: 'Server error' }, 503))
      .mockReturnValueOnce(jsonResponse({ ok: true }));

    const api = createApiClient({
      baseURL: 'https://api.example.com',
      logger: { level: 'silent' },
      retry: {
        maxRetries: 2,
        baseDelay: 10,
        jitter: false,
        retryStatusCodes: [503],
      },
    });

    const result = await api.get('/flaky');
    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry cancelled requests', async () => {
    const controller = new AbortController();

    mockFetch.mockImplementationOnce((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        const abort = () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        };
        if (signal?.aborted) {
          abort();
          return;
        }
        signal?.addEventListener('abort', abort, { once: true });
      });
    });

    const api = createApiClient({
      baseURL: 'https://api.example.com',
      logger: { level: 'silent' },
      timeout: 2000,
      retry: { maxRetries: 3, baseDelay: 10 },
    });

    const promise = api.get('/users', { signal: controller.signal });
    await new Promise((r) => setTimeout(r, 0));
    controller.abort();

    await expect(promise).rejects.toSatisfy(isApiCancellationError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('supports absolute URLs', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ ok: true }));

    const api = createApiClient({ baseURL: 'https://api.example.com' });
    await api.get('https://other.example.com/data');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://other.example.com/data');
  });

  it('setHeader and removeHeader work', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({}));

    const api = createApiClient({ baseURL: 'https://api.example.com' });
    api.setHeader('X-Custom', 'value');
    await api.get('/test');
    expect(mockFetch.mock.calls[0][1].headers['X-Custom']).toBe('value');

    api.removeHeader('X-Custom');
    mockFetch.mockReturnValueOnce(jsonResponse({}));
    await api.get('/test2');
    expect(mockFetch.mock.calls[1][1].headers['X-Custom']).toBeUndefined();
  });
});
