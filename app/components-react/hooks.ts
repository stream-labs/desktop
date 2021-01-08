import { useState, useEffect, useMemo } from 'react';
import { StatefulService } from '../services/core';

/**
 * Creates a reactive state for a React component based on Vuex store
 */
export function useVuex<TReturnValue>(selector: () => TReturnValue): TReturnValue;
export function useVuex<T, TReturnValue>(
  target: T,
  selector: (state: T) => TReturnValue,
): TReturnValue;
export function useVuex(...args: any[]) {
  const selector = args.length === 1 ? args[0] : () => args[1](args[0]);
  const [state, setState] = useState(selector);
  useEffect(() => {
    const unsubscribe = StatefulService.store.watch(
      () => selector(),
      newState => {
        setState(newState);
      },
    );
    return () => {
      unsubscribe();
    };
  });

  return state;
}

/**
 * Call a function once before component first render
 * Helpful if you need to calculate an immutable initial state for a component
 */
export function useOnce<TReturnValue>(cb: () => TReturnValue) {
  return useMemo(cb, []);
}
