import React, { createContext, useContext, useMemo } from 'react';
import { createApiClient, type ApiClient, type ApiClientConfig } from 'api-orchestrator';

const ApiContext = createContext<ApiClient | null>(null);

export interface ApiProviderProps {
  client?: ApiClient;
  config?: ApiClientConfig;
  children: React.ReactNode;
}

export function ApiProvider({ client, config, children }: ApiProviderProps) {
  const value = useMemo(() => {
    if (client) return client;
    return createApiClient(config);
  }, [client, config]);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiContext);
  if (!client) {
    throw new Error(
      'useApiClient must be used within an ApiProvider. Wrap your app with <ApiProvider>.'
    );
  }
  return client;
}
