import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { StatefulService } from '../services/core';
import { createBinding, TBindings } from './shared/inputs';
import { useForm } from './shared/inputs/Form';
import { FormInstance } from 'antd/lib/form/hooks/useForm';

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
 * onCreate shortcut
 * Helpful if you need to calculate an immutable initial state for a component
 */
export function useOnCreate<TReturnValue>(cb: () => TReturnValue) {
  return useState(cb)[0];
}

/**
 * onDestroy shortcut
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
  const [promise] = useState(() => {
    if (asyncCb) {
      return asyncCb(state).then(newState => {
        // do not update the state if the component has been destroyed
        if (isDestroyed) return null;
        setState(newState);
        return newState;
      });
    }
  });

  useOnDestroy(() => {
    isDestroyed = true;
  });

  return [state, setState, promise];
}

type TUseFormStateResult<TState> = {
  s: TState;
  setState: (p: TState) => unknown;
  updateState: (p: Partial<TState>) => unknown;
  bind: TBindings<TState>;
  stateRef: { current: TState };
  form: FormInstance<TState>;
};

/**
 * Create the state object and return helper methods
 */
export function useFormState<T extends object>(initializer: T | (() => T)): TUseFormStateResult<T> {
  const [s, setStateRaw] = useState<T>(initializer);

  // create a reference to the last actual state
  const stateRef = useRef(s);

  // create a reference to AntForm
  const form = useForm();

  function setState(newState: T) {
    // keep the reference in sync when we update the state
    stateRef.current = newState;
    setStateRaw(newState);
  }

  // create a function for state patching
  function updateState(patch: Partial<T>) {
    setState({ ...stateRef.current, ...patch });
  }

  return {
    s,
    setState,
    updateState,
    bind: createBinding(s, setState),
    stateRef,
    form,
  };
}

/**
 * Create a debounced version of the function
 */
export function useDebounce<T extends (...args: any[]) => any>(ms = 0, cb: T) {
  return useCallback(debounce(cb, ms), []);
}
