# api-orchestrator

**Configure once. Use everywhere.**

A comprehensive, configurable API infrastructure toolkit for frontend applications. Built with TypeScript, powered by the native Fetch API, with optional React integration.

## Features

- **HTTP Client** – GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Authentication** – Bearer tokens, API keys, Basic auth, custom providers, token refresh
- **Content Types** – JSON, FormData, URLSearchParams, Blob, ArrayBuffer
- **File Uploads** – Progress tracking (XHR), validation helpers, multi-file
- **Cancellation** – AbortController, timeouts, cancellation-aware retries
- **Error Handling** – Normalized `ApiError`, status handlers, global error callbacks
- **Retries** – Exponential backoff, jitter, Retry-After, idempotent-only defaults
- **Logging** – Structured logs, redaction of secrets, custom loggers
- **Middleware** – Request, response, and error middleware
- **React Hooks** – `useApiQuery`, `useApiMutation`, `useApiUpload`, `ApiProvider`
- **TypeScript-first** – Full type safety and autocomplete
- **JavaScript-friendly** – Works without TypeScript configuration

## Installation

```bash
npm install api-orchestrator
```

For React integration:

```bash
npm install api-orchestrator @api-orchestrator/react
```

## Quick Start

### JavaScript

```js
import { createApiClient } from 'api-orchestrator';

const api = createApiClient({
  baseURL: 'https://api.example.com',
  timeout: 15000,
});

const users = await api.get('/users');
console.log(users);
```

### TypeScript

```ts
import { createApiClient } from 'api-orchestrator';

interface User {
  id: number;
  name: string;
}

const api = createApiClient({
  baseURL: 'https://api.example.com',
});

const users = await api.get<User[]>('/users');
console.log(users[0]?.name);
```

### Authentication

```ts
const api = createApiClient({
  baseURL: '/api',
  auth: {
    type: 'bearer',
    getToken: async () => authService.getAccessToken(),
  },
});
```

### React

```tsx
import { ApiProvider, useApiQuery } from '@api-orchestrator/react';
import { createApiClient } from 'api-orchestrator';

const client = createApiClient({ baseURL: '/api' });

function App() {
  return (
    <ApiProvider client={client}>
      <UserList />
    </ApiProvider>
  );
}

function UserList() {
  const { data, isLoading, error } = useApiQuery('/users');
  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;
  return <ul>{data?.map((u) => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

### Cancellation

```ts
import { isApiCancellationError } from 'api-orchestrator';

const controller = new AbortController();

try {
  const users = await api.get('/users', { signal: controller.signal });
} catch (error) {
  if (isApiCancellationError(error)) {
    // cancelled – not an application failure
  } else {
    throw error;
  }
}

controller.abort();
```

### File Upload with Progress

```ts
const formData = new FormData();
formData.append('file', file);

const result = await api.upload('/files', formData, {
  onUploadProgress: (progress) => {
    console.log(`${progress.percentage}%`);
  },
});
```

### Status Handlers

```ts
const api = createApiClient({
  statusHandlers: {
    401: async ({ error }) => {
      await authService.handleUnauthorized(error);
    },
    403: ({ error }) => {
      notificationService.showForbidden(error);
    },
    422: ({ error }) => {
      formService.handleValidationError(error);
    },
  },
});
```

## API Overview

| Method | Description |
|--------|-------------|
| `createApiClient(config)` | Create a client instance |
| `api.get(url, config?)` | GET request → data |
| `api.post(url, data?, config?)` | POST request → data |
| `api.put / patch / delete / head / options` | Other HTTP methods |
| `api.upload(url, data, config?)` | Multipart upload |
| `api.requestFull(config)` | Full response with metadata |
| `api.setHeader / removeHeader / setAuth` | Runtime config |
| `isApiError / isApiCancellationError` | Error helpers |

## Security Notes

- Tokens are fetched dynamically per request – never captured at init.
- Sensitive headers are redacted from logs by default.
- Confidential API keys must stay on the server. Frontend env vars are not private.
- Do not rely on client-side file validation alone.

## License

MIT
