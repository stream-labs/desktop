import { useState, useEffect } from 'react';
import { StatefulService } from '../services/core';

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
        console.log('target changed');
        setState(newState);
      },
    );
    return () => {
      unsubscribe();
    };
  });

  return state;
}
