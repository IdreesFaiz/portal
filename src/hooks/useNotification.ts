"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseNotificationReturn {
  /** Current error message (null when hidden). */
  errorMsg: string | null;
  /** Current success message (null when hidden). */
  successMsg: string | null;
  /** Show an error message (auto-clears success). */
  showError: (msg: string) => void;
  /** Show a success message (auto-clears error). */
  showSuccess: (msg: string) => void;
  /** Manually clear the error. */
  clearError: () => void;
  /** Manually clear the success. */
  clearSuccess: () => void;
}

/**
 * Manages error and success notification state with auto-dismiss.
 * Only one notification type shows at a time (showing error clears success and vice versa).
 *
 * @param autoDismissMs - Milliseconds before auto-clearing (default 5000). Set to 0 to disable.
 */
export function useNotification(autoDismissMs = 5000): UseNotificationReturn {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const scheduleAutoClear = useCallback(
    (clearFn: () => void) => {
      clearTimers();
      if (autoDismissMs > 0) {
        timerRef.current = setTimeout(clearFn, autoDismissMs);
      }
    },
    [autoDismissMs, clearTimers]
  );

  const clearError = useCallback(() => setErrorMsg(null), []);
  const clearSuccess = useCallback(() => setSuccessMsg(null), []);

  const showError = useCallback(
    (msg: string) => {
      setSuccessMsg(null);
      setErrorMsg(msg);
      scheduleAutoClear(clearError);
    },
    [scheduleAutoClear, clearError]
  );

  const showSuccess = useCallback(
    (msg: string) => {
      setErrorMsg(null);
      setSuccessMsg(msg);
      scheduleAutoClear(clearSuccess);
    },
    [scheduleAutoClear, clearSuccess]
  );

  return { errorMsg, successMsg, showError, showSuccess, clearError, clearSuccess };
}
