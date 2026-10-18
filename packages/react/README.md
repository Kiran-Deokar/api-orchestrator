# @api-orchestrator/react

React integration for [api-orchestrator](https://www.npmjs.com/package/api-orchestrator).

## Install

```bash
npm install api-orchestrator @api-orchestrator/react
```

## Usage

```tsx
import { createApiClient } from 'api-orchestrator';
import { ApiProvider, useApiQuery, useApiMutation, useApiUpload } from '@api-orchestrator/react';

const client = createApiClient({ baseURL: '/api' });

function App() {
  return (
    <ApiProvider client={client}>
      <UserList />
    </ApiProvider>
  );
}

function UserList() {
  const { data, isLoading, error, refetch } = useApiQuery('/users');
  // ...
}
```

## Exports

- `ApiProvider` / `useApiClient`
- `useApiQuery`
- `useApiMutation`
- `useApiUpload`
- `useApiStatus`

## License

MIT
