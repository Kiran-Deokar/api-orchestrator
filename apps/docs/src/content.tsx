import React from 'react';

/** Shared code block with copy button */
export function Code({ children }: { children: string }) {
  const [copied, setCopied] = React.useState(false);
  const text = children.trim();
  const copy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <pre>
      <button type="button" className="copy-btn" onClick={copy}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <code>{text}</code>
    </pre>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return <h2 id={id}>{children}</h2>;
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3>{children}</h3>;
}

export function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <table>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* -------------------------------------------------------------------------- */
/* Pages                                                                      */
/* -------------------------------------------------------------------------- */

export function HomePage() {
  return (
    <div>
      <div className="hero">
        <h1>api-orchestrator</h1>
        <p>
          Configure once. Use everywhere. A production-ready API toolkit for
          JavaScript and TypeScript — HTTP client, auth, retries, uploads, and
          optional React hooks.
        </p>
        <div className="cta">
          <a className="btn btn-primary" href="/installation">
            Install
          </a>
          <a className="btn btn-secondary" href="/quick-start">
            Quick Start
          </a>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <h3>Fetch-native</h3>
          <p>Built on Fetch, with XHR when you need upload progress.</p>
        </div>
        <div className="feature-card">
          <h3>Auth</h3>
          <p>Bearer, API key, Basic, custom, dynamic tokens, refresh.</p>
        </div>
        <div className="feature-card">
          <h3>Resilience</h3>
          <p>Retries, backoff, jitter, timeouts, AbortController.</p>
        </div>
        <div className="feature-card">
          <h3>React hooks</h3>
          <p>useApiQuery, useApiMutation, useApiUpload, ApiProvider.</p>
        </div>
        <div className="feature-card">
          <h3>Errors & status</h3>
          <p>Normalized ApiError and configurable status handlers.</p>
        </div>
        <div className="feature-card">
          <h3>Uploads</h3>
          <p>FormData, progress callbacks, validation helpers.</p>
        </div>
      </div>

      <H2>Minimal example</H2>
      <Code>{`
import { createApiClient } from "api-orchestrator";

const api = createApiClient({
  baseURL: "https://api.example.com",
});

const users = await api.get("/users");
console.log(users);
`}</Code>
    </div>
  );
}

export function IntroductionPage() {
  return (
    <div>
      <h1>Introduction</h1>
      <P>
        <strong>api-orchestrator</strong> is an HTTP client library for frontend
        apps. It centralizes requests, authentication, serialization, errors,
        retries, logging, and optional React integration.
      </P>
      <H2>Design principle</H2>
      <P>
        <em>Configure once. Use everywhere. Customize whenever necessary.</em>
      </P>
      <P>
        You create one (or a few) client instances with shared defaults. Every
        request inherits those defaults and can override them per call.
      </P>
      <H2>What it covers</H2>
      <Ul
        items={[
          'HTTP methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
          'Authentication: Bearer, API key, Basic, custom, token refresh',
          'Bodies: JSON, FormData, URLSearchParams, Blob, ArrayBuffer',
          'File uploads with optional progress (XHR)',
          'Cancellation via AbortController and timeouts',
          'Normalized ApiError and status handlers',
          'Retries with exponential backoff and Retry-After',
          'Structured logging with secret redaction',
          'Request / response middleware and events',
          'Optional React hooks (separate package)',
        ]}
      />
      <H2>What it is not</H2>
      <Ul
        items={[
          'Not a multi-step workflow orchestrator (sequential/parallel pipelines with shared context). For that, use a workflow library and call this client inside steps.',
          'Not a full replacement for TanStack Query cache. Hooks here manage loading/error; pair with TanStack Query if you need advanced server-state caching.',
        ]}
      />
      <H2>Stack</H2>
      <Ul
        items={[
          'TypeScript source, published as JS + .d.ts',
          'Native Fetch (default transport)',
          'XHR when onUploadProgress is provided',
          'Works in modern browsers and Node 18+',
          'ESM and CommonJS builds',
        ]}
      />
    </div>
  );
}

export function InstallationPage() {
  return (
    <div>
      <h1>Installation</h1>
      <H2>Core package</H2>
      <Code>{`npm install api-orchestrator`}</Code>
      <Code>{`yarn add api-orchestrator`}</Code>
      <Code>{`pnpm add api-orchestrator`}</Code>

      <H2>React integration (optional)</H2>
      <Code>{`npm install api-orchestrator @api-orchestrator/react`}</Code>
      <P>
        React is a peer dependency of the React package (<code>{'>=17'}</code>).
      </P>

      <H2>Requirements</H2>
      <Ul
        items={[
          'Node.js 18+ or a modern browser with fetch and AbortController',
          'TypeScript 4.7+ recommended if you use types (not required for JavaScript)',
        ]}
      />

      <H2>From a local tarball</H2>
      <Code>{`npm install ./api-orchestrator-1.0.0.tgz`}</Code>

      <H2>Verify install</H2>
      <Code>{`
import { createApiClient } from "api-orchestrator";

const api = createApiClient({ baseURL: "https://httpbin.org" });
const data = await api.get("/get");
console.log(data);
`}</Code>
    </div>
  );
}

export function QuickStartPage() {
  return (
    <div>
      <h1>Quick Start</h1>

      <H2>JavaScript</H2>
      <P>Create a client and make a GET request:</P>
      <Code>{`
import { createApiClient } from "api-orchestrator";

const api = createApiClient({
  baseURL: "https://jsonplaceholder.typicode.com",
});

const posts = await api.get("/posts", { params: { _limit: 3 } });
console.log(posts);
`}</Code>

      <H2>TypeScript</H2>
      <P>Same API with typed responses:</P>
      <Code>{`
import { createApiClient } from "api-orchestrator";

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

const api = createApiClient({
  baseURL: "https://jsonplaceholder.typicode.com",
});

const posts = await api.get<Post[]>("/posts", { params: { _limit: 3 } });
console.log(posts[0]?.title);
`}</Code>

      <H2>POST example</H2>
      <Code>{`
const created = await api.post("/posts", {
  title: "Hello",
  body: "From api-orchestrator",
  userId: 1,
});
console.log(created);
`}</Code>

      <H2>With authentication and errors</H2>
      <Code>{`
import {
  createApiClient,
  isApiError,
  isApiCancellationError,
} from "api-orchestrator";

const api = createApiClient({
  baseURL: "https://api.example.com",
  auth: {
    type: "bearer",
    getToken: async () => localStorage.getItem("access_token"),
  },
  timeout: 15000,
});

try {
  const user = await api.get("/me");
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
`}</Code>

      <H2>Next steps</H2>
      <Ul
        items={[
          <>Read <a href="/client">Creating a Client</a></>,
          <>Configure <a href="/authentication">Authentication</a></>,
          <>Wire <a href="/react">React hooks</a></>,
        ]}
      />
    </div>
  );
}

export function ClientPage() {
  return (
    <div>
      <h1>Creating a Client</h1>
      <P>
        Everything starts with <code>createApiClient()</code>. You can use one
        global client or several for different APIs.
      </P>

      <H2>Minimal</H2>
      <Code>{`
import { createApiClient } from "api-orchestrator";

const api = createApiClient({
  baseURL: "https://api.example.com",
});
`}</Code>

      <H2>Full configuration</H2>
      <Code>{`
const api = createApiClient({
  baseURL: "https://api.example.com/v1",
  timeout: 15000,
  headers: {
    "X-Client-Version": "1.0.0",
    Accept: "application/json",
  },
  params: {
    locale: "en",
  },
  auth: {
    type: "bearer",
    getToken: () => authStore.getAccessToken(),
  },
  retry: {
    maxRetries: 2,
    baseDelay: 300,
    jitter: true,
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
  },
  logger: {
    level: "warn",
  },
  statusHandlers: {
    401: async ({ error }) => {
      await authStore.logout();
    },
  },
  credentials: "include",
  onError: (error) => {
    // e.g. Sentry.captureException(error)
  },
});
`}</Code>

      <H2>Multiple clients</H2>
      <Code>{`
const publicApi = createApiClient({
  baseURL: "https://api.example.com/public",
});

const adminApi = createApiClient({
  baseURL: "https://api.example.com/admin",
  auth: { type: "bearer", getToken: () => adminToken },
});
`}</Code>

      <H2>Runtime helpers</H2>
      <Code>{`
api.setHeader("X-Request-Id", "abc-123");
api.removeHeader("X-Request-Id");
api.setAuth({ type: "apiKey", apiKey: "new-key" });

const snapshot = api.getConfig(); // readonly config
`}</Code>

      <H2>Config options summary</H2>
      <Table
        headers={['Option', 'Type', 'Description']}
        rows={[
          [<code>baseURL</code>, 'string', 'Prefix for relative URLs'],
          [<code>timeout</code>, 'number', 'Default timeout ms (default 30000)'],
          [<code>headers</code>, 'object', 'Default headers'],
          [<code>params</code>, 'object', 'Default query params'],
          [<code>auth</code>, 'AuthConfig', 'Authentication strategy'],
          [<code>retry</code>, 'RetryConfig | false', 'Retry policy'],
          [<code>logger</code>, 'LoggerConfig', 'Logging'],
          [<code>statusHandlers</code>, 'object', 'Per-status callbacks'],
          [<code>credentials</code>, 'string', 'omit | same-origin | include'],
          [<code>onError</code>, 'function', 'Global error callback'],
          [<code>requestMiddleware</code>, 'array', 'Request hooks'],
          [<code>responseMiddleware</code>, 'array', 'Response hooks'],
          [<code>errorMiddleware</code>, 'array', 'Error hooks'],
        ]}
      />
    </div>
  );
}

export function HttpMethodsPage() {
  return (
    <div>
      <h1>HTTP Methods</h1>
      <P>
        Convenience methods return <strong>response data</strong> directly. Use{' '}
        <code>requestFull</code> when you need status, headers, or metadata.
      </P>

      <Table
        headers={['Method', 'Signature', 'Typical use']}
        rows={[
          [<code>get</code>, <code>api.get(url, config?)</code>, 'Read'],
          [<code>post</code>, <code>api.post(url, data?, config?)</code>, 'Create'],
          [<code>put</code>, <code>api.put(url, data?, config?)</code>, 'Replace'],
          [<code>patch</code>, <code>api.patch(url, data?, config?)</code>, 'Partial update'],
          [<code>delete</code>, <code>api.delete(url, config?)</code>, 'Delete'],
          [<code>head</code>, <code>api.head(url, config?)</code>, 'Headers only'],
          [<code>options</code>, <code>api.options(url, config?)</code>, 'CORS / allow'],
        ]}
      />

      <H2>Examples</H2>
      <Code>{`
// GET
const users = await api.get("/users");

// GET with query params
const page = await api.get("/users", { params: { page: 1, limit: 20 } });

// POST
const created = await api.post("/users", {
  name: "Ada",
  email: "ada@example.com",
});

// PUT
await api.put("/users/1", { name: "Ada Lovelace", email: "ada@example.com" });

// PATCH
await api.patch("/users/1", { name: "Ada L." });

// DELETE
await api.delete("/users/1");
`}</Code>

      <H2>Full response object</H2>
      <Code>{`
const res = await api.requestFull({
  url: "/users/1",
  method: "GET",
});

console.log(res.data);       // body
console.log(res.status);     // 200
console.log(res.statusText); // "OK"
console.log(res.headers);    // Headers
console.log(res.requestId);  // "req_..."
console.log(res.duration);   // ms
console.log(res.config);     // config used
`}</Code>

      <H2>Generic request</H2>
      <Code>{`
const res = await api.request({
  url: "/users",
  method: "GET",
  params: { page: 1 },
});
// res is ApiResponse<T>
`}</Code>
    </div>
  );
}

export function ParamsPage() {
  return (
    <div>
      <h1>Query Parameters &amp; URLs</h1>

      <H2>Relative vs absolute</H2>
      <Code>{`
const api = createApiClient({ baseURL: "https://api.example.com" });

await api.get("/users");
// → https://api.example.com/users

await api.get("https://other.example.com/data");
// → https://other.example.com/data  (baseURL ignored)
`}</Code>

      <H2>Query params object</H2>
      <Code>{`
await api.get("/search", {
  params: {
    q: "hello",
    page: 1,
    tags: ["a", "b"], // tags=a&tags=b
  },
});
`}</Code>
      <P>
        <code>null</code> and <code>undefined</code> values are skipped.
      </P>

      <H2>URLSearchParams</H2>
      <Code>{`
await api.get("/search", {
  params: new URLSearchParams({ q: "hello" }),
});
`}</Code>

      <H2>Default params on the client</H2>
      <Code>{`
const api = createApiClient({
  baseURL: "https://api.example.com",
  params: { locale: "en" },
});

await api.get("/posts", { params: { page: 1 } });
// → .../posts?locale=en&page=1
`}</Code>
    </div>
  );
}

export function HeadersPage() {
  return (
    <div>
      <h1>Headers</h1>

      <H2>Default headers</H2>
      <Code>{`
const api = createApiClient({
  headers: {
    "X-App": "my-app",
    Accept: "application/json",
  },
});
`}</Code>

      <H2>Per-request headers</H2>
      <Code>{`
await api.get("/users", {
  headers: {
    "X-Request-Id": "abc",
  },
});
`}</Code>

      <H2>Runtime mutation</H2>
      <Code>{`
api.setHeader("Authorization", "Bearer xyz");
api.removeHeader("Authorization");
`}</Code>
      <P>
        Prefer <code>auth.getToken</code> over a static Authorization header so
        tokens stay fresh.
      </P>
    </div>
  );
}

export function ContentTypesPage() {
  return (
    <div>
      <h1>Content Types &amp; Bodies</h1>

      <H2>JSON (default for plain objects)</H2>
      <Code>{`
await api.post("/users", { name: "Ada" });
// Content-Type: application/json
// body: {"name":"Ada"}
`}</Code>

      <H2>FormData (multipart)</H2>
      <P>
        Do <strong>not</strong> set Content-Type yourself — the browser adds the
        boundary.
      </P>
      <Code>{`
const form = new FormData();
form.append("file", fileInput.files[0]);
form.append("title", "Report");

await api.post("/uploads", form);
`}</Code>

      <H2>URL-encoded</H2>
      <Code>{`
const body = new URLSearchParams({
  username: "ada",
  password: "secret",
});
await api.post("/login", body);
// Content-Type: application/x-www-form-urlencoded
`}</Code>

      <H2>Text</H2>
      <Code>{`
await api.post("/notes", "plain text body", {
  headers: { "Content-Type": "text/plain" },
});
`}</Code>

      <H2>Binary</H2>
      <Code>{`
await api.post("/files", arrayBuffer, {
  headers: { "Content-Type": "application/octet-stream" },
});

await api.post("/files", blob);
`}</Code>

      <H2>Response type</H2>
      <Code>{`
await api.get("/data"); // auto
await api.get("/data", { responseType: "json" });
await api.get("/data", { responseType: "text" });
const blob = await api.get("/file.pdf", { responseType: "blob" });
const buf = await api.get("/file.bin", { responseType: "arrayBuffer" });
`}</Code>

      <H2>204 No Content</H2>
      <Code>{`
const result = await api.delete("/users/1");
// result === null
`}</Code>
    </div>
  );
}

export function AuthenticationPage() {
  return (
    <div>
      <h1>Authentication</h1>
      <P>
        Tokens are loaded <strong>on every request</strong> via{' '}
        <code>getToken</code> — never captured only once at init time.
      </P>

      <H2>Bearer token</H2>
      <Code>{`
const api = createApiClient({
  baseURL: "/api",
  auth: {
    type: "bearer",
    getToken: async () => {
      return localStorage.getItem("access_token");
      // or: return await authService.getAccessToken();
    },
  },
});
// Sends: Authorization: Bearer <token>
`}</Code>

      <H2>API key</H2>
      <Code>{`
const api = createApiClient({
  auth: {
    type: "apiKey",
    apiKey: "public-key-here",
    apiKeyHeader: "X-API-Key", // default
  },
});
`}</Code>
      <Code>{`
auth: {
  type: "apiKey",
  apiKey: async () => await secrets.getApiKey(),
  apiKeyHeader: "X-API-Key",
}
`}</Code>

      <H2>Basic auth</H2>
      <Code>{`
auth: {
  type: "basic",
  username: "user",
  password: "pass",
}
// Authorization: Basic base64(user:pass)
`}</Code>

      <H2>Custom header</H2>
      <Code>{`
auth: {
  type: "custom",
  headerName: "X-Custom-Auth",
  getAuthHeader: async () => \`Token \${await getToken()}\`,
}
`}</Code>

      <H2>Token refresh on 401</H2>
      <Code>{`
const api = createApiClient({
  auth: {
    type: "bearer",
    getToken: () => tokenStore.accessToken,
    refreshToken: async () => {
      const newToken = await authService.refresh();
      tokenStore.accessToken = newToken;
      return newToken;
    },
    onUnauthorized: async (error) => {
      console.warn("Unauthorized", error.status);
    },
  },
  statusHandlers: {
    401: async () => {
      // optional extra handling
    },
  },
});
`}</Code>
      <P>
        Concurrent 401s share one refresh promise (no thundering herd).
      </P>

      <H2>Per-request override</H2>
      <Code>{`
// Disable auth
await api.get("/public/config", { auth: false });

// Different auth for one call
await api.get("/other", {
  auth: { type: "apiKey", apiKey: "other-key" },
});
`}</Code>

      <H2>Cookies / credentials</H2>
      <Code>{`
const api = createApiClient({
  baseURL: "https://api.example.com",
  credentials: "include",
});
`}</Code>
    </div>
  );
}

export function ErrorsPage() {
  return (
    <div>
      <h1>Error Handling</h1>
      <P>
        Failed requests reject with an <code>ApiError</code> (check with{' '}
        <code>isApiError</code>).
      </P>

      <H2>ApiError fields</H2>
      <Code>{`
{
  name: "ApiError",
  message: string,
  code?: string,          // ERR_HTTP_404, ERR_TIMEOUT, ERR_CANCELED, ...
  status?: number,
  statusText?: string,
  data?: unknown,         // response body
  headers?: Headers,
  url?: string,
  method?: string,
  requestId?: string,
  isApiError: true,
  isCancellation?: boolean,
  isTimeout?: boolean,
  isNetworkError?: boolean,
  isRetryable?: boolean,
  config?: RequestConfig,
  cause?: unknown,
}
`}</Code>

      <H2>Helpers</H2>
      <Code>{`
import {
  isApiError,
  isApiCancellationError,
  isApiTimeoutError,
  isApiNetworkError,
} from "api-orchestrator";

try {
  await api.get("/users");
} catch (err) {
  if (isApiCancellationError(err)) {
    return; // not a user-facing failure
  }
  if (isApiTimeoutError(err)) {
    showToast("Request timed out");
    return;
  }
  if (isApiNetworkError(err)) {
    showToast("Network error");
    return;
  }
  if (isApiError(err)) {
    if (err.status === 404) showToast("Not found");
    else if (err.status === 422) showValidation(err.data);
    else showToast(err.message);
    return;
  }
  throw err;
}
`}</Code>

      <H2>Global onError</H2>
      <Code>{`
const api = createApiClient({
  onError: (error) => {
    if (!error.isCancellation) {
      errorReporter.capture(error);
    }
  },
});
`}</Code>
      <P>
        Exceptions inside <code>onError</code> are isolated and do not change the
        request outcome.
      </P>
    </div>
  );
}

export function StatusHandlersPage() {
  return (
    <div>
      <h1>HTTP Status Handlers</h1>
      <P>
        Run side effects for specific statuses before the promise rejects.
      </P>

      <Code>{`
const api = createApiClient({
  statusHandlers: {
    401: async ({ error, client }) => {
      await authService.handleUnauthorized(error);
    },
    403: ({ error }) => {
      notificationService.showForbidden(error.message);
    },
    404: ({ error }) => {
      console.warn("Not found:", error.url);
    },
    422: ({ error }) => {
      formService.applyServerErrors(error.data);
    },
    429: ({ retryAfter }) => {
      rateLimitBanner.show(retryAfter);
    },
    "5xx": ({ error }) => {
      monitoring.captureServerError(error);
    },
  },
});
`}</Code>

      <H2>Handler context</H2>
      <Code>{`
{
  error: ApiError,
  request: RequestConfig,
  client: ApiClient,
  retryAfter?: number, // ms from Retry-After when present
  response?: Response,
}
`}</Code>

      <H2>Per-request handlers</H2>
      <Code>{`
await api.get("/special", {
  statusHandlers: {
    404: () => console.log("special 404"),
  },
});
`}</Code>

      <H2>Skip handlers</H2>
      <Code>{`
await api.get("/raw", { skipStatusHandlers: true });
`}</Code>

      <P>
        Precedence: per-request exact → per-request range → global exact → global
        range. Only one path runs per response.
      </P>
    </div>
  );
}

export function CancellationPage() {
  return (
    <div>
      <h1>Cancellation &amp; AbortController</h1>

      <H2>Basic pattern</H2>
      <Code>{`
import { isApiCancellationError } from "api-orchestrator";

const controller = new AbortController();

try {
  const data = await api.get("/users", {
    signal: controller.signal,
  });
} catch (err) {
  if (isApiCancellationError(err)) {
    // Cancelled — not an application failure
  } else {
    throw err;
  }
}

controller.abort();
`}</Code>

      <H2>Search-as-you-type</H2>
      <Code>{`
let controller = null;

async function search(query) {
  controller?.abort();
  controller = new AbortController();

  try {
    return await api.get("/search", {
      params: { q: query },
      signal: controller.signal,
    });
  } catch (err) {
    if (isApiCancellationError(err)) return undefined;
    throw err;
  }
}
`}</Code>

      <H2>Rules</H2>
      <Ul
        items={[
          'Aborted requests are not retried by default.',
          'Do not reuse an already-aborted signal — create a new AbortController.',
          'Cancellation does not guarantee the server stopped processing.',
        ]}
      />
    </div>
  );
}

export function TimeoutsPage() {
  return (
    <div>
      <h1>Timeouts</h1>
      <Code>{`
// Client default
const api = createApiClient({ timeout: 10000 });

// Per request
await api.get("/slow", { timeout: 60000 });
`}</Code>
      <P>
        On timeout, the promise rejects with <code>isTimeout === true</code> and{' '}
        <code>code === "ERR_TIMEOUT"</code>.
      </P>
      <Code>{`
import { isApiTimeoutError } from "api-orchestrator";

try {
  await api.get("/slow");
} catch (err) {
  if (isApiTimeoutError(err)) {
    showToast("That took too long");
  }
}
`}</Code>
    </div>
  );
}

export function RetriesPage() {
  return (
    <div>
      <h1>Retry Policies</h1>

      <H2>Safe defaults</H2>
      <Ul
        items={[
          'maxRetries: 0 (off by default)',
          'When enabled, retries idempotent methods by default (GET, HEAD, OPTIONS, PUT, DELETE)',
          'Retries network errors, timeouts, and selected statuses (408, 429, 5xx)',
          'Does not retry cancelled requests or typical validation 4xx',
        ]}
      />

      <H2>Enable retries</H2>
      <Code>{`
const api = createApiClient({
  retry: {
    maxRetries: 3,
    baseDelay: 300,
    maxDelay: 30000,
    jitter: true,
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
    retryNetworkErrors: true,
    retryIdempotentOnly: true,
  },
});
`}</Code>

      <H2>Per-request</H2>
      <Code>{`
await api.get("/flaky", {
  retry: { maxRetries: 5, baseDelay: 200 },
});

// Disable for this call
await api.post("/payments", payload, { retry: false });
`}</Code>

      <H2>Retry-After</H2>
      <P>
        If the response includes a <code>Retry-After</code> header (seconds or HTTP
        date), that delay is used when retrying rate-limit style responses.
      </P>

      <H2>Custom predicate</H2>
      <Code>{`
retry: {
  maxRetries: 3,
  shouldRetry: async (error, attempt) => {
    if (error.status === 409) return false;
    return attempt < 3 && !!error.isRetryable;
  },
}
`}</Code>

      <H2>Idempotent POST</H2>
      <Code>{`
await api.post("/orders", order, {
  idempotencyKey: crypto.randomUUID(),
  retry: { maxRetries: 2, retryIdempotentOnly: false },
});
`}</Code>
      <P>
        Do not blindly retry POST/PATCH without server-side idempotency — you may
        create duplicates.
      </P>
    </div>
  );
}

export function UploadsPage() {
  return (
    <div>
      <h1>File Uploads</h1>

      <H2>Simple upload</H2>
      <Code>{`
const form = new FormData();
form.append("file", file);

const result = await api.upload("/files", form);
`}</Code>

      <H2>With progress</H2>
      <P>
        Uses <strong>XHR</strong> automatically when{' '}
        <code>onUploadProgress</code> is set (Fetch does not expose reliable upload
        progress).
      </P>
      <Code>{`
const form = new FormData();
form.append("file", file);

const result = await api.upload("/files", form, {
  onUploadProgress: (progress) => {
    console.log(progress.percentage); // 0–100
    console.log(progress.loaded, progress.total);
  },
});
`}</Code>

      <H2>File + extra fields</H2>
      <Code>{`
await api.upload("/files", file, {
  fieldName: "document",
  extraFields: {
    title: "Q1 Report",
    folderId: "abc",
  },
});
`}</Code>

      <H2>Client-side validation (UX only)</H2>
      <Code>{`
await api.upload("/files", file, {
  maxSize: 5 * 1024 * 1024, // 5 MB
  allowedTypes: ["image/png", "image/jpeg", "application/pdf"],
});
`}</Code>
      <P>
        Throws <code>ERR_FILE_TOO_LARGE</code> or <code>ERR_FILE_TYPE</code>. Always
        validate again on the server.
      </P>

      <H2>Cancel upload</H2>
      <Code>{`
const controller = new AbortController();

const promise = api.upload("/files", form, {
  signal: controller.signal,
  onUploadProgress: (p) => setProgress(p.percentage),
});

controller.abort();
`}</Code>
    </div>
  );
}

export function LoggingPage() {
  return (
    <div>
      <h1>Logging &amp; Observability</h1>

      <H2>Levels</H2>
      <P>
        <code>debug</code> &lt; <code>info</code> &lt; <code>warn</code> &lt;{' '}
        <code>error</code> &lt; <code>silent</code>
      </P>
      <Code>{`
const api = createApiClient({
  logger: {
    level: "info",
  },
});
`}</Code>

      <H2>Custom logger</H2>
      <Code>{`
logger: {
  level: "debug",
  logger: (entry) => {
    // entry: id, timestamp, level, method, url, status, duration, outcome, ...
    myObservability.track(entry);
  },
  redactKeys: ["authorization", "password", "token"],
  historySize: 50,
}
`}</Code>
      <P>
        Sensitive keys are redacted by default. Logger failures never break
        requests.
      </P>
    </div>
  );
}

export function MiddlewarePage() {
  return (
    <div>
      <h1>Middleware &amp; Events</h1>

      <H2>Request middleware</H2>
      <Code>{`
const api = createApiClient({
  requestMiddleware: [
    async (config) => {
      config.headers = {
        ...config.headers,
        "X-Trace-Id": crypto.randomUUID(),
      };
      return config;
    },
  ],
});
`}</Code>

      <H2>Response middleware</H2>
      <Code>{`
responseMiddleware: [
  async (response) => {
    console.log("got", response.status);
    return response;
  },
],
`}</Code>

      <H2>Error middleware</H2>
      <Code>{`
errorMiddleware: [
  async (error) => {
    return error; // or transform
  },
],
`}</Code>

      <H2>Events</H2>
      <Code>{`
const off = api.on("request", (config) => {
  console.log("starting", config.url);
});

api.on("response", (response) => {
  console.log("done", response.status);
});

api.on("error", (error) => {
  console.log("failed", error.code);
});

api.on("retry", ({ attempt, error }) => {
  console.log("retry", attempt);
});

off(); // unsubscribe
`}</Code>
    </div>
  );
}

export function ReactPage() {
  return (
    <div>
      <h1>React Integration</h1>

      <H2>Install</H2>
      <Code>{`npm install api-orchestrator @api-orchestrator/react`}</Code>

      <H2>Provider</H2>
      <Code>{`
import { createApiClient } from "api-orchestrator";
import { ApiProvider } from "@api-orchestrator/react";

const client = createApiClient({
  baseURL: "/api",
  auth: {
    type: "bearer",
    getToken: () => localStorage.getItem("token"),
  },
});

function App() {
  return (
    <ApiProvider client={client}>
      <UserPage />
    </ApiProvider>
  );
}
`}</Code>

      <H2>useApiQuery</H2>
      <Code>{`
import { useApiQuery } from "@api-orchestrator/react";

interface User {
  id: number;
  name: string;
}

function UserList() {
  const { data, error, isLoading, isFetching, refetch, cancel } =
    useApiQuery<User[]>("/users", {
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
`}</Code>
      <Ul
        items={[
          'Aborts on unmount',
          'Stale-response protection',
          'isLoading vs isFetching (initial vs background)',
        ]}
      />

      <H2>useApiMutation</H2>
      <Code>{`
import { useApiMutation } from "@api-orchestrator/react";

function CreateUserForm() {
  const { mutate, isLoading, isSuccess, error } = useApiMutation({
    method: "POST",
    url: "/users",
    onSuccess: (user) => console.log("created", user.id),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const name = new FormData(e.currentTarget).get("name");
        mutate({ name });
      }}
    >
      <input name="name" required />
      <button disabled={isLoading}>
        {isLoading ? "Saving…" : "Create"}
      </button>
      {isSuccess && <span>Saved!</span>}
      {error && <span>{error.message}</span>}
    </form>
  );
}
`}</Code>

      <H3>Dynamic URL</H3>
      <Code>{`
useApiMutation({
  method: "PATCH",
  url: (vars) => \`/users/\${vars.id}\`,
});
`}</Code>

      <H2>useApiUpload</H2>
      <Code>{`
import { useApiUpload } from "@api-orchestrator/react";

function FileUploader() {
  const { upload, progress, isUploading, error, cancel } = useApiUpload({
    onProgress: (p) => console.log(p.percentage),
  });

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await upload("/files", file, {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ["image/*", "application/pdf"],
    });
  };

  return (
    <div>
      <input type="file" onChange={onChange} disabled={isUploading} />
      {isUploading && (
        <progress value={progress?.percentage ?? 0} max={100} />
      )}
      <button type="button" onClick={() => cancel()}>
        Cancel
      </button>
      {error && <p>{error.message}</p>}
    </div>
  );
}
`}</Code>

      <H2>useApiClient</H2>
      <Code>{`
import { useApiClient } from "@api-orchestrator/react";

function ManualFetch() {
  const api = useApiClient();
  return (
    <button onClick={() => api.get("/stats").then(console.log)}>
      Load
    </button>
  );
}
`}</Code>

      <H2>useApiStatus</H2>
      <Code>{`
import { useApiStatus } from "@api-orchestrator/react";

const { isPending, setPending, setSuccess, setError, reset } =
  useApiStatus();
`}</Code>
    </div>
  );
}

export function TypeScriptPage() {
  return (
    <div>
      <h1>TypeScript Guide</h1>
      <Code>{`
import { createApiClient, ApiError, isApiError } from "api-orchestrator";

interface User {
  id: number;
  name: string;
}

const api = createApiClient({
  baseURL: "https://api.example.com",
});

const users = await api.get<User[]>("/users");
const user = await api.post<User>("/users", { name: "Ada" });

try {
  await api.get("/x");
} catch (err) {
  if (isApiError(err)) {
    const status: number | undefined = err.status;
    const data: unknown = err.data;
  }
}
`}</Code>
      <P>
        Generics apply to method return types. Config and request options are
        fully typed for autocomplete.
      </P>
    </div>
  );
}

export function JavaScriptPage() {
  return (
    <div>
      <h1>JavaScript Guide</h1>
      <P>No TypeScript required.</P>
      <Code>{`
import { createApiClient, isApiError } from "api-orchestrator";

const api = createApiClient({
  baseURL: "https://api.example.com",
});

async function main() {
  try {
    const users = await api.get("/users");
    console.log(users);
  } catch (err) {
    if (isApiError(err)) {
      console.error(err.status, err.message);
    }
  }
}

main();
`}</Code>
      <H2>CommonJS</H2>
      <Code>{`
const { createApiClient } = require("api-orchestrator");
`}</Code>
    </div>
  );
}

export function SecurityPage() {
  return (
    <div>
      <h1>Security Best Practices</h1>
      <Ul
        items={[
          <>
            <strong>Never put private secrets in frontend env vars.</strong>{' '}
            VITE_* / REACT_APP_* values ship in the browser bundle. Only public
            keys on the client; confidential keys stay on the server.
          </>,
          <>
            <strong>Prefer dynamic tokens</strong> via <code>auth.getToken</code>{' '}
            so tokens can rotate. Avoid hardcoding Bearer strings.
          </>,
          <>
            <strong>Do not log secrets.</strong> The logger redacts common keys;
            still avoid putting passwords in custom log meta.
          </>,
          <>Use <strong>HTTPS</strong> in production.</>,
          <>
            <strong>Validate uploads on the server.</strong> Client maxSize /
            allowedTypes are UX only.
          </>,
          <>
            For cookie sessions, combine <code>credentials: "include"</code> with
            your CSRF strategy.
          </>,
          <>
            Use <strong>idempotency keys</strong> when retrying mutations.
          </>,
        ]}
      />
      <H2>Example: production-minded client</H2>
      <Code>{`
export const api = createApiClient({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 20000,
  auth: {
    type: "bearer",
    getToken: () => localStorage.getItem("access_token"),
    refreshToken: async () => {
      const res = await fetch("/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("refresh failed");
      const { accessToken } = await res.json();
      localStorage.setItem("access_token", accessToken);
      return accessToken;
    },
  },
  retry: { maxRetries: 2, baseDelay: 300, jitter: true },
  statusHandlers: {
    401: async () => {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    },
  },
  logger: { level: import.meta.env.DEV ? "debug" : "warn" },
});
`}</Code>
    </div>
  );
}

export function ApiReferencePage() {
  return (
    <div>
      <h1>API Reference</h1>

      <H2>createApiClient(config?)</H2>
      <P>Returns an <code>ApiClient</code> instance.</P>

      <H2>ApiClient methods</H2>
      <Table
        headers={['Method', 'Returns']}
        rows={[
          [<code>get(url, config?)</code>, <code>Promise&lt;T&gt;</code>],
          [<code>post(url, data?, config?)</code>, <code>Promise&lt;T&gt;</code>],
          [<code>put(url, data?, config?)</code>, <code>Promise&lt;T&gt;</code>],
          [<code>patch(url, data?, config?)</code>, <code>Promise&lt;T&gt;</code>],
          [<code>delete(url, config?)</code>, <code>Promise&lt;T&gt;</code>],
          [<code>head / options</code>, <code>Promise&lt;T&gt;</code>],
          [<code>upload(url, data, config?)</code>, <code>Promise&lt;T&gt;</code>],
          [<code>request(config)</code>, <code>Promise&lt;ApiResponse&lt;T&gt;&gt;</code>],
          [<code>requestFull(config)</code>, <code>Promise&lt;ApiResponse&lt;T&gt;&gt;</code>],
          [<code>getConfig()</code>, 'snapshot'],
          [<code>setHeader / removeHeader / setAuth</code>, 'void'],
          [<code>on(event, handler)</code>, 'unsubscribe fn'],
        ]}
      />

      <H2>Helpers</H2>
      <Table
        headers={['Export', 'Purpose']}
        rows={[
          [<code>isApiError</code>, 'Type guard'],
          [<code>isApiCancellationError</code>, 'Aborted request'],
          [<code>isApiTimeoutError</code>, 'Timeout'],
          [<code>isApiNetworkError</code>, 'Network failure'],
          [<code>ApiError</code>, 'Error class'],
          [<code>FetchTransport / XHRTransport</code>, 'Custom transports'],
        ]}
      />

      <H2>React (@api-orchestrator/react)</H2>
      <Table
        headers={['Export', 'Purpose']}
        rows={[
          [<code>ApiProvider</code>, 'Context provider'],
          [<code>useApiClient</code>, 'Access client'],
          [<code>useApiQuery</code>, 'Query state'],
          [<code>useApiMutation</code>, 'Mutation state'],
          [<code>useApiUpload</code>, 'Upload + progress'],
          [<code>useApiStatus</code>, 'Manual status flags'],
        ]}
      />
    </div>
  );
}

export function TroubleshootingPage() {
  return (
    <div>
      <h1>Troubleshooting</h1>

      <H2>“Request was cancelled” unexpectedly</H2>
      <Ul
        items={[
          'A component unmounted and aborted the signal.',
          'You reused an aborted AbortController — create a new one per request.',
        ]}
      />

      <H2>Upload progress is always 0</H2>
      <P>
        Pass <code>onUploadProgress</code>. Without it, Fetch is used and does not
        emit upload progress.
      </P>

      <H2>Double requests in React Strict Mode</H2>
      <P>
        React 18 Strict Mode double-invokes effects in development. Queries may
        run twice in dev only.
      </P>

      <H2>CORS errors</H2>
      <P>
        Must be fixed on the API server (<code>Access-Control-*</code> headers).
      </P>

      <H2>401 loop</H2>
      <P>
        Ensure <code>refreshToken</code> fails cleanly and you do not retry forever
        on permanent auth failure.
      </P>

      <H2>Types not found</H2>
      <Code>{`
npm install api-orchestrator
# tsconfig moduleResolution: "node" or "bundler"
`}</Code>
    </div>
  );
}

export function ChangelogPage() {
  return (
    <div>
      <h1>Changelog</h1>
      <H2>1.0.0</H2>
      <Ul
        items={[
          'createApiClient with full HTTP method set',
          'Auth: bearer, API key, basic, custom, refresh coordination',
          'JSON, FormData, URLSearchParams, binary bodies',
          'Upload helper with progress (XHR) and validation helpers',
          'AbortController cancellation and timeouts',
          'Normalized ApiError and status handlers',
          'Retries with backoff, jitter, Retry-After',
          'Logging with redaction',
          'Middleware and events',
          'React package: ApiProvider, useApiQuery, useApiMutation, useApiUpload, useApiStatus',
          'ESM + CommonJS + TypeScript declarations',
        ]}
      />
    </div>
  );
}
