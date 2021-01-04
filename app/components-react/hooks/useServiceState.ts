import { useState, useEffect, useMemo } from 'react';
import { Store } from 'vuex';
import { StatefulService, ViewHandler } from '../../services/core';
import { pick } from 'lodash';

// export function useServiceState<TService extends { state: any; store: Store<any> }, TReturnValue>(
//   service: TService,
//   selector: (state: TService['state']) => TReturnValue,
// ): TReturnValue {
//   const [state, setState] = useState(selector(service.state));
//   useEffect(() => {
//     const unsubscribe = service.store.watch(
//       () => selector(service.state),
//       newState => {
//         console.log('state changed');
//         setState(newState);
//       },
//     );
//     return () => {
//       unsubscribe();
//     };
//   });
//
//   return state;
// }

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

// export function useView<TView>(
//   view: TView,
//   selector: (state: TView) => TView,
// ): TView {
//   const [state, setState] = useState(selector(view));
//   useEffect(() => {
//     const unsubscribe = StatefulService.store.watch(
//       () => selector(view),
//       newState => {
//         console.log('view changed');
//         setState(newState);
//       },
//     );
//     return () => {
//       unsubscribe();
//     };
//   });
//
//   return state;
// }

// export function useServiceState<TService extends { state: any; store: Store<any> }, TReturnValue>(
//   service: TService,
// ): TService['state'] {
//   const [state, setState] = useState(service.state);
//
//   const watcher = useMemo(() => new ReactiveWatcher(service.state), []);
//
//   useEffect(() => {
//     watcher.onChange(newState => setState(newState))
//     return () => {
//       watcher.destroy();
//     };
//   });
//
//   return state;
// }
//
// class ReactiveWatcher<T extends Object> {
//   private watchedProps: { [key: string]: boolean };
//   private vuexUnwatch: Function | null = null;
//   private onChangeHandler: Function | null = null;
//   private value: T;
//
//   constructor(private target: T) {
//     this.value = new Proxy(target, {
//       get: (t, propName) => {
//         this.watchedProps[propName as string] = true;
//         return target[propName];
//       },
//     });
//
//     setTimeout(
//       () =>
//         (this.vuexUnwatch = StatefulService.store.watch(
//           () => pick(this.target, Object.keys(this.watchedProps)),
//           newState => this.onChangeHandler && this.onChangeHandler(newState),
//         )),
//     );
//   }
//
//   onChange(cb: (newValue: T) => unknown) {
//     this.onChangeHandler = cb;
//   }
//
//   destroy() {
//     this.vuexUnwatch && this.vuexUnwatch();
//   }
// }
