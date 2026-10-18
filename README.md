# api-orchestrator

**Configure once. Use everywhere.**

A production-ready API infrastructure toolkit for JavaScript and TypeScript applications.

## Packages

| Package | Description |
|---------|-------------|
| [`api-orchestrator`](./packages/core) | Core HTTP client – framework agnostic |
| [`@api-orchestrator/react`](./packages/react) | React hooks and provider |

## Features

- Native Fetch transport (optional XHR for upload progress)
- Bearer / API-key / Basic / custom authentication
- Dynamic token providers and coordinated refresh
- JSON, FormData, binary, and custom content types
- File upload & download helpers
- AbortController cancellation and timeouts
- Normalized errors (`ApiError`, `isApiCancellationError`, …)
- Configurable HTTP status handlers
- Retries with exponential backoff + Retry-After
- Structured logging with secret redaction
- Request / response middleware
- Full TypeScript support + plain JavaScript
- Optional React integration (`useApiQuery`, `useApiMutation`, `useApiUpload`)

## Quick start

```bash
npm install api-orchestrator
```

```ts
import { createApiClient } from 'api-orchestrator';

const api = createApiClient({
  baseURL: 'https://api.example.com',
  auth: {
    type: 'bearer',
    getToken: () => localStorage.getItem('token'),
  },
});

const users = await api.get('/users');
```

## Monorepo scripts

```bash
npm run build        # build core + react
npm run test         # run tests
npm run typecheck    # TypeScript check
npm run docs:dev     # documentation site
npm run pack         # produce .tgz packages
```

## Documentation

**Complete guide (every feature, explanations, copy-paste examples):** [GUIDE.md](./GUIDE.md)

Also:

- [packages/core/README.md](./packages/core/README.md) — package overview
- [apps/docs](./apps/docs) — documentation website
- [examples/](./examples) — JavaScript, TypeScript, and React samples

## License

MIT
