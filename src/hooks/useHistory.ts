// src/hooks/useHistory.ts

import { useState, useCallback, useRef } from 'react';

export function useHistory<T>(initialPresent: T, maxHistoryLength: number = 40) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialPresent);
  const [future, setFuture] = useState<T[]>([]);

  // Ref to hold current state to avoid stale closure in rapid events
  const presentRef = useRef<T>(initialPresent);
  presentRef.current = present;

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, prevPast.length - 1);

      setFuture((prevFuture) => [presentRef.current, ...prevFuture]);
      setPresent(previous);
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setPast((prevPast) => [...prevPast, presentRef.current]);
      setPresent(next);
      return newFuture;
    });
  }, []);

  const set = useCallback(
    (newPresent: T | ((curr: T) => T), recordHistory: boolean = true) => {
      setPresent((curr) => {
        const computed = typeof newPresent === 'function' ? (newPresent as (c: T) => T)(curr) : newPresent;
        if (recordHistory) {
          setPast((prevPast) => {
            const updated = [...prevPast, curr];
            if (updated.length > maxHistoryLength) {
              return updated.slice(updated.length - maxHistoryLength);
            }
            return updated;
          });
          setFuture([]);
        }
        return computed;
      });
    },
    [maxHistoryLength]
  );

  const reset = useCallback((newInitial: T) => {
    setPast([]);
    setFuture([]);
    setPresent(newInitial);
  }, []);

  return {
    state: present,
    setState: set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    historyLength: past.length,
  };
}
