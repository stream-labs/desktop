import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
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

/**
 * An onCreate shortcut
 * Helpful if you need to calculate an immutable initial state for a component
 */
export function useOnCreate<TReturnValue>(cb: () => TReturnValue) {
  return useMemo(cb, []);
}

/**
 * An onDestroy shortcut
 */
export function useOnDestroy(cb: () => void) {
  useEffect(() => cb, []);
}

/**
 * Init state with an async callback
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
        // do not set state if the component has been destroyed
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

type TStateActions<StateType> = {
  s: StateType;
  setState: (p: StateType) => unknown;
  updateState: (p: Partial<StateType>) => unknown;
  setItem: <TDict extends keyof StateType, TKey extends keyof StateType[TDict]>(
    dictionaryName: TDict,
    key: TKey,
    value: StateType[TDict][TKey],
  ) => unknown;
};

export function useStateActions<T extends object>(initializer: T): TStateActions<T>;
export function useStateActions<T extends object>(initializer: () => T): TStateActions<T>;
export function useStateActions<T>(initializer: any) {
  const [s, setState] = useState<T>(initializer);
  return {
    s,
    setState,
    setItem<TDict extends keyof T, TKey extends keyof T[TDict]>(
      dictionaryName: TDict,
      key: TKey,
      value: T[TDict][TKey],
    ): void {
      setState({ ...s, [dictionaryName]: {} });
    },
    updateState(patch: Partial<T>) {
      setState({ ...s, ...patch });
    },
  };
}

export function useDebounce<T extends (...args: any[]) => any>(ms: number, cb: T) {
  return useCallback(debounce(cb, ms), []);
}

function MyDecorator(...args: any) {
  console.log('call my decorator', args);
}
