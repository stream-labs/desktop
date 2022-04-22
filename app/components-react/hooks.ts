import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { StatefulService } from '../services/core';

/**
 * Creates a reactive state for a React component based on Vuex store
 */
export function useVuex<TReturnValue>(selector: () => TReturnValue, deep = true): TReturnValue {
  const [state, setState] = useState(selector);
  useEffect(() => {
    const unsubscribe = StatefulService.store.watch(
      () => selector(),
      newState => {
        setState(newState);
      },
      { deep },
    );
    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Create a debounced version of the function
 */
export function useDebounce<T extends (...args: any[]) => any>(ms = 0, cb: T) {
  return useCallback(debounce(cb, ms), []);
}

/**
 * Sets a function that guarantees a re-render and fresh state on every tick of the delay
 */
export function useRenderInterval(callback: () => void, delay: number, condition = true) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (condition) {
      const timeout = window.setTimeout(() => {
        callback();
        setTick(tick + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [tick, condition]);
}
