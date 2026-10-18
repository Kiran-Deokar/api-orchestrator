import { useCallback, useRef, useState } from 'react';
import type { ApiError, ProgressEvent, UploadConfig } from 'api-orchestrator';
import { isApiCancellationError } from 'api-orchestrator';
import { useApiClient } from './provider';

export interface UseApiUploadOptions<T> extends UploadConfig {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  onProgress?: (progress: ProgressEvent) => void;
}

export interface UseApiUploadResult<T> {
  upload: (
    url: string,
    data: FormData | File | Blob,
    config?: UploadConfig
  ) => Promise<T | undefined>;
  data: T | undefined;
  error: ApiError | null;
  isUploading: boolean;
  progress: ProgressEvent | null;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
  cancel: () => void;
}

export function useApiUpload<T = unknown>(
  options: UseApiUploadOptions<T> = {}
): UseApiUploadResult<T> {
  const client = useApiClient();
  const { onSuccess, onError, onProgress, ...defaultConfig } = options;

  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<ApiError | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setIsUploading(false);
    setProgress(null);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const upload = useCallback(
    async (
      url: string,
      fileData: FormData | File | Blob,
      config: UploadConfig = {}
    ): Promise<T | undefined> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsUploading(true);
      setError(null);
      setProgress(null);

      try {
        const result = await client.upload<T>(url, fileData, {
          ...defaultConfig,
          ...config,
          signal: controller.signal,
          onUploadProgress: (p) => {
            setProgress(p);
            onProgress?.(p);
            config.onUploadProgress?.(p);
          },
        });

        setData(result);
        setIsUploading(false);
        onSuccess?.(result);
        return result;
      } catch (err) {
        if (isApiCancellationError(err)) {
          setIsUploading(false);
          return undefined;
        }
        const apiErr = err as ApiError;
        setError(apiErr);
        setIsUploading(false);
        onError?.(apiErr);
        return undefined;
      }
    },
    [client, defaultConfig, onSuccess, onError, onProgress]
  );

  return {
    upload,
    data,
    error,
    isUploading,
    progress,
    isSuccess: !isUploading && !error && data !== undefined,
    isError: !!error,
    reset,
    cancel,
  };
}
