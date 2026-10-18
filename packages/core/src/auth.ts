import type { AuthConfig, RequestConfig } from './types';

/**
 * Apply authentication headers to a request config.
 * Tokens are fetched dynamically per request.
 */
export async function applyAuth(
  config: RequestConfig,
  globalAuth?: AuthConfig
): Promise<RequestConfig> {
  const auth = config.auth === false ? undefined : config.auth ?? globalAuth;
  if (!auth || auth.type === 'none') {
    return config;
  }

  const headers = { ...(config.headers || {}) };

  switch (auth.type) {
    case 'bearer': {
      let token: string | null | undefined;
      if (auth.getToken) {
        token = await auth.getToken();
      }
      if (token) {
        const headerName = auth.headerName || 'Authorization';
        headers[headerName] = `Bearer ${token}`;
      }
      break;
    }
    case 'apiKey': {
      let key: string | undefined;
      if (typeof auth.apiKey === 'function') {
        key = await auth.apiKey();
      } else {
        key = auth.apiKey;
      }
      if (key) {
        const headerName = auth.apiKeyHeader || auth.headerName || 'X-API-Key';
        headers[headerName] = key;
      }
      break;
    }
    case 'basic': {
      if (auth.username != null) {
        const credentials = btoa(`${auth.username}:${auth.password ?? ''}`);
        headers['Authorization'] = `Basic ${credentials}`;
      }
      break;
    }
    case 'custom': {
      if (auth.getAuthHeader) {
        const value = await auth.getAuthHeader();
        if (value) {
          const headerName = auth.headerName || 'Authorization';
          headers[headerName] = value;
        }
      }
      break;
    }
  }

  return { ...config, headers };
}

/**
 * Simple token-refresh coordination to avoid thundering herd.
 */
let refreshPromise: Promise<string | null> | null = null;

export async function coordinatedRefresh(
  refreshToken: () => Promise<string | null>
): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = (async () => {
    try {
      return await refreshToken();
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}
