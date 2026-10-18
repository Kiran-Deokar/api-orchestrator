/**
 * JavaScript example – basic usage of api-orchestrator
 * Run after: npm install api-orchestrator (or from packed tarball)
 */

import { createApiClient, isApiCancellationError } from 'api-orchestrator';

const api = createApiClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  logger: { level: 'info' },
});

async function main() {
  // GET
  const posts = await api.get('/posts', { params: { _limit: 3 } });
  console.log('Posts:', posts);

  // POST
  const created = await api.post('/posts', {
    title: 'Hello from api-orchestrator',
    body: 'Works in plain JavaScript',
    userId: 1,
  });
  console.log('Created:', created);

  // Cancellation
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 1);
  try {
    await api.get('/posts/1', { signal: controller.signal });
  } catch (err) {
    if (isApiCancellationError(err)) {
      console.log('Request cancelled as expected');
    } else {
      throw err;
    }
  }
}

main().catch(console.error);
