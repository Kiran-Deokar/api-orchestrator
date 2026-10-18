# Changelog

## 1.0.0 (2026-10-18)

### Added

- `createApiClient()` – full-featured HTTP client based on Fetch
- Authentication: bearer, API key, basic, custom, token refresh coordination
- Content-type serialization: JSON, FormData, URLSearchParams, Blob, ArrayBuffer
- File uploads with progress (XHR transport) and client-side validation helpers
- Request cancellation via AbortController / AbortSignal
- Configurable timeouts
- Normalized `ApiError` with cancellation / timeout / network classification
- HTTP status handlers (exact and range)
- Retry with exponential backoff, jitter, and Retry-After support
- Structured logging with secret redaction
- Request / response / error middleware
- Convenience methods: get, post, put, patch, delete, head, options, upload
- `requestFull()` for access to status, headers, and metadata
- TypeScript types and declaration files
- ESM and CommonJS builds
- React package (`@api-orchestrator/react`) with ApiProvider, useApiQuery, useApiMutation, useApiUpload, useApiStatus

### Notes

- Upload progress requires XHR (automatically selected when `onUploadProgress` is provided)
- Fetch is the default transport; Axios is not required
- React is an optional peer dependency
