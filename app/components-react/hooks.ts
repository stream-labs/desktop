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
  }, []);

  return state;
}

// export function useVuexT(...args: any[]) {
//   const selector = args.length === 1 ? args[0] : () => args[1](args[0]);
//   const [state, setState] = useState(selector);
//   useEffect(() => {
//     const unsubscribe = StatefulService.store.watch(
//       () => selector(),
//       newState => {
//         setState(newState);
//       },
//     );
//     return () => {
//       unsubscribe();
//     };
//   }, []);
//
//   return state;
// }

/**
 * Call a function once before component first render
 * Helpful if you need to calculate an immutable initial state for a component
 */
export function useOnCreate<TReturnValue>(cb: () => TReturnValue) {
  return useMemo(cb, []);
}

/**
 * Init state with a callback
 *
 * TODO: remove
 *
 * Use when
 *  - you need to initialized
 */
export function useAsyncState<TStateType>(
  defaultState: TStateType | (() => TStateType),
  asyncCb?: (initialState: TStateType) => Promise<TStateType>,
): [TStateType, (newState: TStateType) => unknown, Promise<TStateType | null> | undefined] {
  // define a state
  const [state, setState] = useState(defaultState);

  let isDestroyed = false;

  // create and save the promise if provided
  const promise = useMemo(() => {
    if (asyncCb) {
      return asyncCb(state).then(newState => {
        if (isDestroyed) return null;
        setState(newState);
        return newState;
      });
    }
  }, []);

  useOnDestroy(() => {
    isDestroyed = true;
  });

  return [state, setState, promise];
}

/**
 * A shortcut for component destroy
 */
export function useOnDestroy(cb: () => void) {
  useEffect(() => cb, []);
}
