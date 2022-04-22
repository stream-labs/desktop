import React, { useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash/debounce';
import { StatefulService } from '../services/core';
import { createBinding, TBindings } from './shared/inputs';
import { useForm } from './shared/inputs/Form';
import { FormInstance } from 'antd/lib/form/hooks/useForm';

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
 * Create a debounced version of the function
 */
export function useDebounce<T extends (...args: any[]) => any>(ms = 0, cb: T) {
  return useCallback(debounce(cb, ms), []);
}

/**
 * Returns a function for force updating of the component
 * Use it only for frequently used components for optimization purposes
 *
 * Current implementation from
 * https://github.com/ant-design/ant-design/blob/master/components/_util/hooks/useForceUpdate.ts
 */
export function useForceUpdate() {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  return forceUpdate;
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
