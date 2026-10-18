/**
 * React example – ApiProvider + useApiQuery + useApiMutation
 */

import React from 'react';
import { createApiClient } from 'api-orchestrator';
import {
  ApiProvider,
  useApiQuery,
  useApiMutation,
} from '@api-orchestrator/react';

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

const client = createApiClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
});

function PostList() {
  const { data, isLoading, error, refetch } = useApiQuery<Post[]>('/posts', {
    params: { _limit: 5 },
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {data?.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </div>
  );
}

function CreatePost() {
  const { mutate, isLoading, isSuccess } = useApiMutation<Post, Partial<Post>>({
    method: 'POST',
    url: '/posts',
    onSuccess: (post) => console.log('Created', post.id),
  });

  return (
    <div>
      <button
        disabled={isLoading}
        onClick={() =>
          mutate({ title: 'New post', body: 'Hello', userId: 1 })
        }
      >
        {isLoading ? 'Creating…' : 'Create Post'}
      </button>
      {isSuccess && <span> Created!</span>}
    </div>
  );
}

export default function App() {
  return (
    <ApiProvider client={client}>
      <h1>api-orchestrator React Example</h1>
      <CreatePost />
      <PostList />
    </ApiProvider>
  );
}
