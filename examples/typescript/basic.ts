/**
 * TypeScript example – typed responses and errors
 */

import {
  createApiClient,
  ApiError,
  isApiError,
  isApiCancellationError,
} from 'api-orchestrator';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

const api = createApiClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  statusHandlers: {
    404: ({ error }) => {
      console.warn('Not found:', error.url);
    },
  },
});

async function main() {
  const posts = await api.get<Post[]>('/posts', { params: { _limit: 2 } });
  console.log(posts[0]?.title);

  const post = await api.get<Post>('/posts/1');
  console.log(post.title);

  try {
    await api.get('/does-not-exist');
  } catch (err) {
    if (isApiError(err)) {
      console.log('Status:', err.status, 'Code:', err.code);
    }
  }

  // Full response when you need headers / status
  const full = await api.requestFull<Post>({ url: '/posts/1', method: 'GET' });
  console.log('Status:', full.status, 'RequestId:', full.requestId);
}

main().catch(console.error);
