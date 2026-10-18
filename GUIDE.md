# api-orchestrator — Complete Developer Guide

**Configure once. Use everywhere.**

A production-ready API infrastructure toolkit for JavaScript and TypeScript frontend applications.

---

## Table of Contents

1. [What is api-orchestrator?](#1-what-is-api-orchestrator)
2. [Installation](#2-installation)
3. [Quick Start](#3-quick-start)
4. [Creating a Client](#4-creating-a-client)
5. [HTTP Methods](#5-http-methods)
6. [Query Parameters & URLs](#6-query-parameters--urls)
7. [Headers](#7-headers)
8. [Request Body & Content Types](#8-request-body--content-types)
9. [Authentication](#9-authentication)
10. [Response Handling](#10-response-handling)
11. [Error Handling](#11-error-handling)
12. [HTTP Status Handlers](#12-http-status-handlers)
13. [Cancellation (AbortController)](#13-cancellation-abortcontroller)
14. [Timeouts](#14-timeouts)
15. [Retries](#15-retries)
16. [File Uploads](#16-file-uploads)
17. [Logging](#17-logging)
18. [Middleware](#18-middleware)
19. [Events](#19-events)
20. [React Integration](#20-react-integration)
21. [TypeScript Usage](#21-typescript-usage)
22. [JavaScript Usage](#22-javascript-usage)
23. [Security Best Practices](#23-security-best-practices)
24. [API Reference](#24-api-reference)
25. [Troubleshooting](#25-troubleshooting)
26. [Comparison with Similar Libraries](#26-comparison-with-similar-libraries)

---

## 1. What is api-orchestrator?

`api-orchestrator` is an HTTP client library built on the **native Fetch API**. It centralizes:

- HTTP requests (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Authentication (Bearer, API key, Basic, custom)
- JSON / FormData / binary serialization
- File uploads with progress
- Cancellation and timeouts
- Normalized errors
- Configurable HTTP status handling
- Retries with exponential backoff
- Structured logging
- Optional React hooks

### Design principle

> **Configure once. Use everywhere. Customize whenever necessary.**

You create one (or a few) client instances with shared defaults. Every request inherits those defaults and can override them per call.

### What it is not

- It is **not** a multi-step workflow orchestrator (like `api-orchestrator-ts`). For sequential/parallel *pipelines of steps*, use that kind of tool *on top of* this client.
- It does **not** replace TanStack Query’s cache. React hooks here manage loading/error state; for advanced server-state caching, pair with TanStack Query if needed.

---

## 2. Installation

### Core package (required)

```bash
npm install api-orchestrator
```

```bash
yarn add api-orchestrator
```

```bash
pnpm add api-orchestrator
```

### React integration (optional)

```bash
npm install api-orchestrator @api-orchestrator/react
```

`react` is a peer dependency of the React package (`>=17`).

### Requirements

- Node.js 18+ **or** a modern browser with `fetch` and `AbortController`
- TypeScript 4.7+ recommended if using types (not required for JS)

### From the local tarball

```bash
npm install ./packages/core/api-orchestrator-1.0.0.tgz
```

---

## 3. Quick Start

### JavaScript

```js
import { createApiClient } from 'api-orchestrator';

const api = createApiClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
});

const posts = await api.get('/posts', { params: { _limit: 3 } });
console.log(posts);
```

### TypeScript

```ts
import { createApiClient } from 'api-orchestrator';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

const api = createApiClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
});

const posts = await api.get<Post[]>('/posts', { params: { _limit: 3 } });
console.log(posts[0]?.title);
```

### With auth + error handling

```ts
import {
  createApiClient,
  isApiError,
  isApiCancellationError,
} from 'api-orchestrator';

const api = createApiClient({
  baseURL: 'https://api.example.com',
  auth: {
    type: 'bearer',
    getToken: async () => localStorage.getItem('access_token'),
  },
  timeout: 15000,
});

try {
  const user = await api.get('/me');
  console.log(user);
} catch (err) {
  if (isApiCancellationError(err)) {
    // User navigated away — ignore
  } else if (isApiError(err)) {
    console.error(err.status, err.message, err.data);
  } else {
    throw err;
  }
}
```

---

## 4. Creating a Client

### Basic

```ts
import { createApiClient } from 'api-orchestrator';

const api = createApiClient({
  baseURL: 'https://api.example.com',
});
```

### Full configuration example

```ts
const api = createApiClient({
  // Prefix for relative URLs
  baseURL: 'https://api.example.com/v1',

  // Default timeout in milliseconds (default: 30000)
  timeout: 15000,

  // Default headers sent on every request
  headers: {
    'X-Client-Version': '1.0.0',
    Accept: 'application/json',
  },

  // Default query params
  params: {
    locale: 'en',
  },

  // Authentication (see §9)
  auth: {
    type: 'bearer',
    getToken: () => authStore.getAccessToken(),
  },

  // Retry policy (see §15)
  retry: {
    maxRetries: 2,
    baseDelay: 300,
    jitter: true,
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
  },

  // Logging (see §17)
  logger: {
    level: 'warn', // 'debug' | 'info' | 'warn' | 'error' | 'silent'
  },

  // Status handlers (see §12)
  statusHandlers: {
    401: async ({ error }) => {
      await authStore.logout();
    },
  },

  // Credentials for cookie-based auth
  credentials: 'include', // 'omit' | 'same-origin' | 'include'

  // Global error callback
  onError: (error) => {
    // e.g. Sentry.captureException(error)
  },
});
```

### Multiple clients

Use separate instances for different APIs:

```ts
const publicApi = createApiClient({
  baseURL: 'https://api.example.com/public',
});

const adminApi = createApiClient({
  baseURL: 'https://api.example.com/admin',
  auth: { type: 'bearer', getToken: () => adminToken },
});
```

### Runtime config helpers

```ts
api.setHeader('X-Request-Id', 'abc-123');
api.removeHeader('X-Request-Id');
api.setAuth({ type: 'apiKey', apiKey: 'new-key' });

const config = api.getConfig(); // readonly snapshot
```

---

## 5. HTTP Methods

All methods return a **Promise** that resolves to the **response data** (not the full response object).

| Method | Signature | Typical use |
|--------|-----------|-------------|
| `get` | `api.get(url, config?)` | Read resources |
| `post` | `api.post(url, data?, config?)` | Create resources |
| `put` | `api.put(url, data?, config?)` | Replace resources |
| `patch` | `api.patch(url, data?, config?)` | Partial update |
| `delete` | `api.delete(url, config?)` | Delete resources |
| `head` | `api.head(url, config?)` | Headers only |
| `options` | `api.options(url, config?)` | CORS / allowed methods |

### Examples

```ts
// GET
const users = await api.get('/users');

// GET with query params
const page = await api.get('/users', { params: { page: 1, limit: 20 } });

// POST
const created = await api.post('/users', { name: 'Ada', email: 'ada@example.com' });

// PUT
const replaced = await api.put('/users/1', { name: 'Ada Lovelace', email: 'ada@example.com' });

// PATCH
const patched = await api.patch('/users/1', { name: 'Ada L.' });

// DELETE
await api.delete('/users/1');

// HEAD
await api.head('/users/1');
```

### Full response (status, headers, metadata)

When you need more than `data`:

```ts
const res = await api.requestFull({
  url: '/users/1',
  method: 'GET',
});

console.log(res.data);       // parsed body
console.log(res.status);     // 200
console.log(res.statusText); // 'OK'
console.log(res.headers);    // Headers instance
console.log(res.requestId);  // e.g. 'req_mvdgrdf0_z5x06jb'
console.log(res.duration);   // ms
console.log(res.config);     // request config used
```

Or via `request`:

```ts
const res = await api.request({
  url: '/users',
  method: 'GET',
  params: { page: 1 },
});
// res is ApiResponse<T>
```

---

## 6. Query Parameters & URLs

### Relative vs absolute URLs

```ts
const api = createApiClient({ baseURL: 'https://api.example.com' });

await api.get('/users');
// → https://api.example.com/users

await api.get('https://other.example.com/data');
// → https://other.example.com/data  (baseURL ignored)
```

### Query params

```ts
// Object form
await api.get('/search', {
  params: {
    q: 'hello',
    page: 1,
    tags: ['a', 'b'], // repeated: tags=a&tags=b
  },
});

// URLSearchParams
await api.get('/search', {
  params: new URLSearchParams({ q: 'hello' }),
});
```

`null` and `undefined` values are skipped.

### Default params on the client

```ts
const api = createApiClient({
  baseURL: 'https://api.example.com',
  params: { locale: 'en' },
});

await api.get('/posts', { params: { page: 1 } });
// → .../posts?locale=en&page=1
```

---

## 7. Headers

### Default headers

```ts
const api = createApiClient({
  headers: {
    'X-App': 'my-app',
    Accept: 'application/json',
  },
});
```

### Per-request override

```ts
await api.get('/users', {
  headers: {
    'X-Request-Id': 'abc',
    // overrides or adds to defaults
  },
});
```

### Runtime mutation

```ts
api.setHeader('Authorization', 'Bearer xyz');
api.removeHeader('Authorization');
```

**Note:** Prefer `auth.getToken` over a static `Authorization` header so tokens stay fresh.

---

## 8. Request Body & Content Types

### JSON (default for plain objects)

```ts
await api.post('/users', { name: 'Ada' });
// Content-Type: application/json
// body: {"name":"Ada"}
```

### FormData (multipart)

**Do not** set `Content-Type` yourself — the browser adds the boundary.

```ts
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('title', 'Report');

await api.post('/uploads', form);
// Content-Type is set by the browser (multipart/form-data; boundary=...)
```

### URL-encoded forms

```ts
const body = new URLSearchParams({ username: 'ada', password: 'secret' });
await api.post('/login', body);
// Content-Type: application/x-www-form-urlencoded
```

### Text

```ts
await api.post('/notes', 'plain text body', {
  headers: { 'Content-Type': 'text/plain' },
});
```

### Binary

```ts
await api.post('/files', arrayBuffer, {
  headers: { 'Content-Type': 'application/octet-stream' },
});

await api.post('/files', blob);
```

### Response types

```ts
// Auto (default): JSON if content-type says so, else text/blob
await api.get('/data');

// Force JSON
await api.get('/data', { responseType: 'json' });

// Force text
await api.get('/data', { responseType: 'text' });

// Blob (downloads)
const blob = await api.get('/file.pdf', { responseType: 'blob' });

// ArrayBuffer
const buf = await api.get('/file.bin', { responseType: 'arrayBuffer' });
```

### Empty responses (204)

```ts
const result = await api.delete('/users/1');
// result === null for 204 No Content
```

---

## 9. Authentication

Tokens are loaded **on every request** via `getToken` — never captured once at init.

### Bearer token

```ts
const api = createApiClient({
  baseURL: '/api',
  auth: {
    type: 'bearer',
    getToken: async () => {
      return localStorage.getItem('access_token');
      // or: return await authService.getAccessToken();
    },
  },
});
```

Sends: `Authorization: Bearer <token>`

### API key

```ts
const api = createApiClient({
  auth: {
    type: 'apiKey',
    apiKey: 'public-key-here',
    apiKeyHeader: 'X-API-Key', // default
  },
});
```

Or dynamic:

```ts
auth: {
  type: 'apiKey',
  apiKey: async () => await secrets.getApiKey(),
  apiKeyHeader: 'X-API-Key',
}
```

### Basic auth

```ts
auth: {
  type: 'basic',
  username: 'user',
  password: 'pass',
}
```

Sends: `Authorization: Basic base64(user:pass)`

### Custom header

```ts
auth: {
  type: 'custom',
  headerName: 'X-Custom-Auth',
  getAuthHeader: async () => `Token ${await getToken()}`,
}
```

### Token refresh (401)

```ts
const api = createApiClient({
  auth: {
    type: 'bearer',
    getToken: () => tokenStore.accessToken,
    refreshToken: async () => {
      const newToken = await authService.refresh();
      tokenStore.accessToken = newToken;
      return newToken;
    },
    onUnauthorized: async (error) => {
      console.warn('Unauthorized', error.status);
    },
  },
  statusHandlers: {
    401: async () => {
      // optional extra handling
    },
  },
});
```

Concurrent 401s share a single refresh promise (no thundering herd).

### Per-request auth override

```ts
// Disable auth for this request
await api.get('/public/config', { auth: false });

// Different auth for one call
await api.get('/other', {
  auth: { type: 'apiKey', apiKey: 'other-key' },
});
```

### Cookie / credentials

```ts
const api = createApiClient({
  baseURL: 'https://api.example.com',
  credentials: 'include', // send cookies cross-origin when allowed
});
```

---

## 10. Response Handling

### Success path

Methods resolve with **parsed data** only:

```ts
const user = await api.get<User>('/users/1');
// user is User
```

### Validate status

By default, status `200–299` is success. Customize:

```ts
const api = createApiClient({
  validateStatus: (status) => status < 500, // treat 4xx as "success" data
});

// Or per request
await api.get('/maybe', {
  validateStatus: (s) => s === 200 || s === 404,
});
```

### Transform response

```ts
const names = await api.get('/users', {
  transformResponse: (data) => (data as User[]).map((u) => u.name),
});
```

---

## 11. Error Handling

All failures reject with an **`ApiError`** (or a value that passes `isApiError`).

### ApiError shape

```ts
interface ApiError {
  name: 'ApiError';
  message: string;
  code?: string;           // e.g. 'ERR_HTTP_404', 'ERR_TIMEOUT', 'ERR_CANCELED'
  status?: number;         // HTTP status when available
  statusText?: string;
  data?: unknown;          // response body
  headers?: Headers;
  url?: string;
  method?: string;
  requestId?: string;
  isApiError: true;
  isCancellation?: boolean;
  isTimeout?: boolean;
  isNetworkError?: boolean;
  isRetryable?: boolean;
  config?: RequestConfig;
  cause?: unknown;
}
```

### Helpers

```ts
import {
  isApiError,
  isApiCancellationError,
  isApiTimeoutError,
  isApiNetworkError,
} from 'api-orchestrator';

try {
  await api.get('/users');
} catch (err) {
  if (isApiCancellationError(err)) {
    // AbortController — usually not a user-facing error
    return;
  }
  if (isApiTimeoutError(err)) {
    showToast('Request timed out');
    return;
  }
  if (isApiNetworkError(err)) {
    showToast('Network error — check connection');
    return;
  }
  if (isApiError(err)) {
    if (err.status === 404) showToast('Not found');
    else if (err.status === 422) showValidation(err.data);
    else showToast(err.message);
    return;
  }
  throw err;
}
```

### Global onError

```ts
const api = createApiClient({
  onError: (error) => {
    if (!error.isCancellation) {
      errorReporter.capture(error);
    }
  },
});
```

`onError` never converts a success into a failure. Exceptions inside `onError` are swallowed.

---

## 12. HTTP Status Handlers

Run side effects for specific statuses **before** the promise rejects.

```ts
const api = createApiClient({
  statusHandlers: {
    401: async ({ error, client }) => {
      await authService.handleUnauthorized(error);
    },
    403: ({ error }) => {
      notificationService.showForbidden(error.message);
    },
    404: ({ error }) => {
      console.warn('Not found:', error.url);
    },
    422: ({ error }) => {
      formService.applyServerErrors(error.data);
    },
    429: ({ retryAfter }) => {
      rateLimitBanner.show(retryAfter);
    },
    // Ranges
    '5xx': ({ error }) => {
      monitoring.captureServerError(error);
    },
  },
});
```

### Handler context

```ts
{
  error: ApiError;
  request: RequestConfig;
  client: ApiClient;
  retryAfter?: number; // ms, from Retry-After header when present
  response?: Response;
}
```

### Per-request handlers

```ts
await api.get('/special', {
  statusHandlers: {
    404: () => console.log('special 404'),
  },
});
```

### Skip handlers

```ts
await api.get('/raw', { skipStatusHandlers: true });
```

**Precedence:** per-request exact status → per-request range → global exact → global range.  
Handlers for a given response run once (exact wins over range).

---

## 13. Cancellation (AbortController)

### Basic pattern

```ts
import { isApiCancellationError } from 'api-orchestrator';

const controller = new AbortController();

try {
  const data = await api.get('/users', {
    signal: controller.signal,
  });
} catch (err) {
  if (isApiCancellationError(err)) {
    // Cancelled — not an application failure
  } else {
    throw err;
  }
}

// Cancel from UI, route change, etc.
controller.abort();
```

### Search-as-you-type

```ts
let controller: AbortController | null = null;

async function search(query: string) {
  controller?.abort();
  controller = new AbortController();

  try {
    return await api.get('/search', {
      params: { q: query },
      signal: controller.signal,
    });
  } catch (err) {
    if (isApiCancellationError(err)) return undefined;
    throw err;
  }
}
```

### Rules

- An aborted request is **not** retried by default.
- Do **not** reuse an already-aborted signal for a new request — create a new `AbortController`.
- Cancellation does not guarantee the server stopped processing.

---

## 14. Timeouts

```ts
// Client default
const api = createApiClient({ timeout: 10000 });

// Per request
await api.get('/slow', { timeout: 60000 });
```

On timeout, the promise rejects with an `ApiError` where `isTimeout === true` and `code === 'ERR_TIMEOUT'`.

```ts
import { isApiTimeoutError } from 'api-orchestrator';

try {
  await api.get('/slow');
} catch (err) {
  if (isApiTimeoutError(err)) {
    showToast('That took too long');
  }
}
```

---

## 15. Retries

### Defaults (safe)

- `maxRetries: 0` (off by default)
- Retries **idempotent** methods only when enabled (`GET`, `HEAD`, `OPTIONS`, `PUT`, `DELETE`)
- Retries network errors, timeouts, and selected status codes (408, 429, 5xx)
- Does **not** retry cancelled requests or typical 4xx validation errors

### Enable retries

```ts
const api = createApiClient({
  retry: {
    maxRetries: 3,
    baseDelay: 300,      // ms
    maxDelay: 30000,
    jitter: true,        // full jitter (recommended)
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
    retryNetworkErrors: true,
    retryIdempotentOnly: true,
  },
});
```

### Per-request

```ts
await api.get('/flaky', {
  retry: { maxRetries: 5, baseDelay: 200 },
});

// Disable for this call
await api.post('/payments', payload, { retry: false });
```

### Retry-After

If the response includes `Retry-After` (seconds or HTTP date), that delay is used when retrying 429/503-style responses.

### Custom predicate

```ts
retry: {
  maxRetries: 3,
  shouldRetry: async (error, attempt) => {
    if (error.status === 409) return false;
    return attempt < 3 && !!error.isRetryable;
  },
}
```

### Important

Do **not** blindly retry `POST`/`PATCH` without idempotency keys or server support — you may double-charge or create duplicates.

```ts
await api.post('/orders', order, {
  idempotencyKey: crypto.randomUUID(),
  retry: { maxRetries: 2, retryIdempotentOnly: false },
});
```

---

## 16. File Uploads

### Simple upload

```ts
const form = new FormData();
form.append('file', file);

const result = await api.upload('/files', form);
```

### With progress

Uses **XHR** automatically when `onUploadProgress` is set (Fetch does not expose upload progress reliably).

```ts
const form = new FormData();
form.append('file', file);

const result = await api.upload('/files', form, {
  onUploadProgress: (progress) => {
    console.log(progress.percentage); // 0–100
    console.log(progress.loaded, progress.total);
  },
});
```

### File + extra fields

```ts
await api.upload('/files', file, {
  fieldName: 'document',
  extraFields: {
    title: 'Q1 Report',
    folderId: 'abc',
  },
});
```

### Client-side validation (UX only)

```ts
await api.upload('/files', file, {
  maxSize: 5 * 1024 * 1024, // 5 MB
  allowedTypes: ['image/png', 'image/jpeg', 'application/pdf'],
});
```

Throws `ApiError` with `ERR_FILE_TOO_LARGE` or `ERR_FILE_TYPE` if validation fails.

**Always validate again on the server.**

### Cancellation

```ts
const controller = new AbortController();

const promise = api.upload('/files', form, {
  signal: controller.signal,
  onUploadProgress: (p) => setProgress(p.percentage),
});

// User clicks Cancel
controller.abort();
```

---

## 17. Logging

### Levels

`debug` < `info` < `warn` < `error` < `silent`

```ts
const api = createApiClient({
  logger: {
    level: 'info',
  },
});
```

### Custom logger

```ts
logger: {
  level: 'debug',
  logger: (entry) => {
    // entry: { id, timestamp, level, method, url, status, duration, outcome, ... }
    myObservability.track(entry);
  },
  redactKeys: ['authorization', 'password', 'token'],
  historySize: 50, // optional in-memory ring buffer
}
```

Secrets in headers/meta are redacted by default (`authorization`, `token`, `api_key`, etc.).

Logger failures never break the request.

---

## 18. Middleware

### Request middleware

Runs before the request is sent (after config merge).

```ts
const api = createApiClient({
  requestMiddleware: [
    async (config) => {
      config.headers = {
        ...config.headers,
        'X-Trace-Id': crypto.randomUUID(),
      };
      return config;
    },
  ],
});
```

### Response middleware

```ts
responseMiddleware: [
  async (response) => {
    console.log('got', response.status);
    return response;
  },
],
```

### Error middleware

```ts
errorMiddleware: [
  async (error) => {
    // transform or rethrow
    return error;
  },
],
```

Order: global middleware arrays run in registration order.

---

## 19. Events

```ts
const off = api.on('request', (config) => {
  console.log('starting', config.url);
});

api.on('response', (response) => {
  console.log('done', response.status);
});

api.on('error', (error) => {
  console.log('failed', error.code);
});

api.on('retry', ({ attempt, error }) => {
  console.log('retry', attempt);
});

// Unsubscribe
off();
```

Handler exceptions are isolated and do not fail the request.

---

## 20. React Integration

### Setup

```tsx
import { createApiClient } from 'api-orchestrator';
import { ApiProvider } from '@api-orchestrator/react';

const client = createApiClient({
  baseURL: '/api',
  auth: {
    type: 'bearer',
    getToken: () => localStorage.getItem('token'),
  },
});

function App() {
  return (
    <ApiProvider client={client}>
      <UserPage />
    </ApiProvider>
  );
}
```

You can also pass `config` instead of `client`:

```tsx
<ApiProvider config={{ baseURL: '/api' }}>
  {children}
</ApiProvider>
```

### useApiQuery

```tsx
import { useApiQuery } from '@api-orchestrator/react';

interface User {
  id: number;
  name: string;
}

function UserList() {
  const { data, error, isLoading, isFetching, refetch, cancel } =
    useApiQuery<User[]>('/users', {
      params: { limit: 20 },
      enabled: true,
      onSuccess: (users) => console.log(users.length),
      onError: (err) => console.error(err.message),
    });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <button onClick={() => cancel()}>Cancel</button>
      <ul>
        {data?.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

Features:

- Automatic abort on unmount
- Stale-response protection (older responses do not overwrite newer ones)
- `isLoading` vs `isFetching` (initial vs background)

### useApiMutation

```tsx
import { useApiMutation } from '@api-orchestrator/react';

function CreateUserForm() {
  const { mutate, mutateAsync, isLoading, isSuccess, error, reset } =
    useApiMutation<User, { name: string }>({
      method: 'POST',
      url: '/users',
      onSuccess: (user) => {
        console.log('created', user.id);
      },
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const name = new FormData(e.currentTarget).get('name') as string;
        mutate({ name });
      }}
    >
      <input name="name" required />
      <button disabled={isLoading}>
        {isLoading ? 'Saving…' : 'Create'}
      </button>
      {isSuccess && <span>Saved!</span>}
      {error && <span>{error.message}</span>}
    </form>
  );
}
```

Dynamic URL:

```tsx
useApiMutation({
  method: 'PATCH',
  url: (vars: { id: number }) => `/users/${vars.id}`,
});
```

### useApiUpload

```tsx
import { useApiUpload } from '@api-orchestrator/react';

function FileUploader() {
  const { upload, progress, isUploading, error, cancel } = useApiUpload({
    onProgress: (p) => console.log(p.percentage),
  });

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload('/files', file, {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['image/*', 'application/pdf'],
    });
  };

  return (
    <div>
      <input type="file" onChange={onChange} disabled={isUploading} />
      {isUploading && <progress value={progress?.percentage ?? 0} max={100} />}
      <button type="button" onClick={() => cancel()}>
        Cancel
      </button>
      {error && <p>{error.message}</p>}
    </div>
  );
}
```

### useApiClient

```tsx
import { useApiClient } from '@api-orchestrator/react';

function ManualFetch() {
  const api = useApiClient();

  const load = async () => {
    const data = await api.get('/stats');
    console.log(data);
  };

  return <button onClick={load}>Load</button>;
}
```

### useApiStatus

Lightweight status machine when you manage fetches yourself:

```tsx
import { useApiStatus } from '@api-orchestrator/react';

const { isPending, setPending, setSuccess, setError, reset } = useApiStatus();
```

---

## 21. TypeScript Usage

### Generics on methods

```ts
interface User {
  id: number;
  name: string;
}

const users = await api.get<User[]>('/users');
const user = await api.post<User>('/users', { name: 'Ada' });
```

### Typed errors

```ts
import { ApiError, isApiError } from 'api-orchestrator';

try {
  await api.get('/x');
} catch (err) {
  if (isApiError(err)) {
    const status: number | undefined = err.status;
    const data: unknown = err.data;
  }
}
```

### Config typing

Autocomplete works on `createApiClient({ ... })` and per-request `RequestConfig`.

---

## 22. JavaScript Usage

No TypeScript required:

```js
import { createApiClient, isApiError } from 'api-orchestrator';

const api = createApiClient({
  baseURL: 'https://api.example.com',
});

async function main() {
  try {
    const users = await api.get('/users');
    console.log(users);
  } catch (err) {
    if (isApiError(err)) {
      console.error(err.status, err.message);
    }
  }
}

main();
```

CommonJS (if your bundler/Node setup uses require):

```js
const { createApiClient } = require('api-orchestrator');
```

---

## 23. Security Best Practices

1. **Never put private secrets in frontend env vars**  
   `VITE_*` / `REACT_APP_*` values are public in the browser bundle. Only use **public** API keys on the client. Confidential keys stay on the server.

2. **Prefer dynamic tokens**  
   Use `auth.getToken` so tokens can rotate. Avoid hardcoding Bearer strings in source.

3. **Do not log secrets**  
   The logger redacts common keys; still avoid putting passwords in custom log meta.

4. **HTTPS only** in production.

5. **Validate uploads on the server**  
   Client `maxSize` / `allowedTypes` are UX only.

6. **CSRF**  
   For cookie sessions, pair with your framework’s CSRF strategy (`credentials: 'include'` + CSRF token header as needed).

7. **Retries and POST**  
   Use idempotency keys for retried mutations.

---

## 24. API Reference

### `createApiClient(config?: ApiClientConfig): ApiClient`

### `ApiClient` methods

| Method | Returns |
|--------|---------|
| `get(url, config?)` | `Promise<T>` (data) |
| `post(url, data?, config?)` | `Promise<T>` |
| `put(url, data?, config?)` | `Promise<T>` |
| `patch(url, data?, config?)` | `Promise<T>` |
| `delete(url, config?)` | `Promise<T>` |
| `head(url, config?)` | `Promise<T>` |
| `options(url, config?)` | `Promise<T>` |
| `upload(url, data, config?)` | `Promise<T>` |
| `request(config)` | `Promise<ApiResponse<T>>` |
| `requestFull(config)` | `Promise<ApiResponse<T>>` |
| `getConfig()` | config snapshot |
| `setHeader(key, value)` | `void` |
| `removeHeader(key)` | `void` |
| `setAuth(auth)` | `void` |
| `on(event, handler)` | unsubscribe `() => void` |

### Helpers

| Export | Purpose |
|--------|---------|
| `isApiError(err)` | Type guard |
| `isApiCancellationError(err)` | Aborted request |
| `isApiTimeoutError(err)` | Timeout |
| `isApiNetworkError(err)` | Network failure |
| `ApiError` | Error class |
| `FetchTransport` / `XHRTransport` | Custom transports |

### React exports (`@api-orchestrator/react`)

| Export | Purpose |
|--------|---------|
| `ApiProvider` | Context provider |
| `useApiClient` | Access client |
| `useApiQuery` | GET-style query state |
| `useApiMutation` | Mutation state |
| `useApiUpload` | Upload + progress |
| `useApiStatus` | Manual status flags |

---

## 25. Troubleshooting

### “Request was cancelled” unexpectedly

- A component unmounted and aborted the signal.
- You reused an aborted `AbortController` — create a new one per request.

### Upload progress is always 0

- Progress requires `onUploadProgress`. Without it, Fetch is used (no upload progress events).

### Double requests in React Strict Mode

- React 18 Strict Mode double-invokes effects in development. Queries may run twice; that is expected in dev.

### CORS errors

- Not fixable in the client alone. Configure the API server’s `Access-Control-*` headers.

### 401 loop

- Ensure `refreshToken` fails cleanly and you do not retry forever on permanent auth failure.

### Types not found

```bash
npm install api-orchestrator
# Ensure "moduleResolution" is "node" or "bundler" in tsconfig
```

### Tests hang on abort

- Mock `fetch` must reject on `signal.aborted` **and** on the `abort` event (see package tests).

---

## 26. Comparison with Similar Libraries

| Concern | api-orchestrator | Axios | ky | api-orchestrator-ts |
|---------|------------------|-------|-----|---------------------|
| Transport | Fetch (+ XHR for upload progress) | XHR | Fetch | N/A (workflow) |
| Auth helpers | Bearer / API key / Basic / refresh | Interceptors | Hooks | Step-level |
| React hooks | Yes (optional package) | No | No | No |
| Status handlers | Built-in map | Manual | Hooks | Failure classification |
| Multi-step workflows | No | No | No | **Yes** (core feature) |
| Tree-shakeable ESM | Yes | Limited | Yes | Yes |

**Use api-orchestrator** for app HTTP + React.  
**Use api-orchestrator-ts** (or similar) when you need sequential/parallel *step pipelines* with shared context — you can call this client inside those steps.

---

## Copy-paste recipes

### Authenticated app client

```ts
import { createApiClient, isApiCancellationError, isApiError } from 'api-orchestrator';

export const api = createApiClient({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000,
  auth: {
    type: 'bearer',
    getToken: () => localStorage.getItem('access_token'),
    refreshToken: async () => {
      const res = await fetch('/auth/refresh', { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('refresh failed');
      const { accessToken } = await res.json();
      localStorage.setItem('access_token', accessToken);
      return accessToken;
    },
  },
  retry: {
    maxRetries: 2,
    baseDelay: 300,
    jitter: true,
  },
  statusHandlers: {
    401: async () => {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    },
  },
  onError: (error) => {
    if (!error.isCancellation) {
      console.error('[api]', error.code, error.message);
    }
  },
  logger: { level: import.meta.env.DEV ? 'debug' : 'warn' },
});
```

### Safe fetch helper

```ts
export async function safeGet<T>(url: string, signal?: AbortSignal): Promise<T | undefined> {
  try {
    return await api.get<T>(url, { signal });
  } catch (err) {
    if (isApiCancellationError(err)) return undefined;
    if (isApiError(err)) throw err;
    throw err;
  }
}
```

---

## License

MIT

---

*This guide matches api-orchestrator v1.0.0. All examples use the real public API surface of the package.*
