import { useCallback, useState } from 'react';

export type RequestStatus = 'idle' | 'pending' | 'success' | 'error';

export interface UseApiStatusResult {
  status: RequestStatus;
  isIdle: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  setPending: () => void;
  setSuccess: () => void;
  setError: () => void;
  reset: () => void;
}

export function useApiStatus(
  initial: RequestStatus = 'idle'
): UseApiStatusResult {
  const [status, setStatus] = useState<RequestStatus>(initial);

  const setPending = useCallback(() => setStatus('pending'), []);
  const setSuccess = useCallback(() => setStatus('success'), []);
  const setError = useCallback(() => setStatus('error'), []);
  const reset = useCallback(() => setStatus('idle'), []);

  return {
    status,
    isIdle: status === 'idle',
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
    setPending,
    setSuccess,
    setError,
    reset,
  };
}
