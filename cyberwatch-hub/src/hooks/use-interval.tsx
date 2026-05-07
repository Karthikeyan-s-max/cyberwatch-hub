import { useEffect, useRef } from 'react';

/**
 * useInterval
 * Calls `callback` every `delay` milliseconds while `active` is true.
 */
export default function useInterval(callback: () => void, delay: number | null, active = true) {
  const savedRef = useRef(callback);

  useEffect(() => {
    savedRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active || delay === null) return;
    const id = setInterval(() => savedRef.current(), delay);
    return () => clearInterval(id);
  }, [delay, active]);
}
