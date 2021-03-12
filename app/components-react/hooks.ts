import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { debounce, isEqual, pick } from 'lodash';
import { StatefulService, ViewHandler } from '../services/core';
import { createBinding, TBindings } from './shared/inputs';
import { useForm } from './shared/inputs/Form';
import { FormInstance } from 'antd/lib/form/hooks/useForm';
import { assertIsDefined } from '../util/properties-type-guards';
import { Observable, Subject, Subscription } from 'rxjs';
import { keys } from '../services/utils';

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
 * Create a debounced version of the function
 */
export function useDebounce<T extends (...args: any[]) => any>(ms = 0, cb: T) {
  return useCallback(debounce(cb, ms), []);
}

/**
 * Init state with an async callback
 * TODO investigate if we can just use a library for the async code https://github.com/slorber/react-async-hook
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

  function setItem<TDict extends keyof T, TKey extends keyof T[TDict]>(
    dictionaryName: TDict,
    key: TKey,
    value: T[TDict][TKey],
  ): void {
    setState({
      ...stateRef.current,
      [dictionaryName]: { ...stateRef.current[dictionaryName], [key]: value },
    });
  }

  return {
    s,
    setState,
    updateState,
    setItem,
    bind: createBinding(s, setState),
    stateRef,
    form,
  };
}

type TUseFormStateResult<TState extends object> = {
  s: TState;
  setState: (p: TState) => unknown;
  updateState: (p: Partial<TState>) => unknown;
  setItem: <TDict extends keyof TState, TKey extends keyof TState[TDict]>(
    dictionaryName: TDict,
    key: TKey,
    value: TState[TDict][TKey],
  ) => unknown;
  bind: TBindings<TState, keyof TState>;
  stateRef: { current: TState };
  form: FormInstance<TState>;
};

type Flatten<T> = T extends (infer R)[] ? R : never;

export const GenericStateManagerContext = React.createContext(null);

/**
 * A simple state manager
 * Use it when several components need a shared state which is not a global vuex state
 */
export function useStateManager<TComputedProps extends object, TState extends object, TActions extends object, TView extends TMergedTipple<TState, TActions, TComputedProps>>(
  initialState: TState | (() => TState),
  actionsConstructor: (getState: () => TState, setState: (newState: TState) => void) => TActions,
  debug: string,
  watch?: (state: TMerged<TState, TActions>) => TComputedProps //= (function defaultWatcher(){ return {} as TComputedProps})
): TUseStateManagerResult<TState, TActions, TComputedProps> {
  const context = useContext(GenericStateManagerContext) as React.Context<{state: TState, actions: TActions}> | null;
  const [state] = useState(initialState);
  const stateRef = useRef<TState>(state);
  const ref = useRef<any>(null);
  const [version, setVersion] = useState(0);
  const onDestroyObservableRef = useRef(new Subject());
  const watcherRef = useRef(watch);
  const debugRef = useRef(debug);

  const contextValue = useOnCreate(() => {
    if (context) return context as unknown as {Context: React.Context<{view: TView}>};

    // THIS CODE RUNS ONLY ONES PER CONTEXT

    const stateChanged = new Subject();

    function getState() {
      return stateRef.current;
    }

    function setState(newState: TState) {
      stateRef.current = newState;
      stateChanged.next(newState);
    }

    const actions = actionsConstructor(getState, setState);
    const Context = GenericStateManagerContext;
    const mergedStateAndActions = mergeToProxy(getState as TState, actions);


    const view = mergedStateAndActions;
    // mergeToProxy(
    //   mergedStateAndActions, () => {
    //     console.log('Debug', debugRef.current);
    //     return watcherRef.current ? watcherRef.current(mergedStateAndActions) as TComputedProps : {} as TComputedProps
    //   });


    const value = mergeToProxy({ Context, stateChanged }, view);
    value['contextValue'] = value;

    ref.current = value;
    return value;
  });

  const reactiveWatcher = useOnCreate(() => {
    const viewWithComputedProps = watch ? mergeToProxy(contextValue, () => watch(contextValue as TMerged<TState, TActions>)) : contextValue;
    return applyReactiveWatcher(viewWithComputedProps, contextValue['stateChanged'],() => setVersion(prevVersion => prevVersion + 1), onDestroyObservableRef.current, debug )
  });

  useOnDestroy(() => {
    onDestroyObservableRef.current.next();
  });

  return reactiveWatcher as TUseStateManagerResult<TState, TActions, TComputedProps>;
}

type TUseStateManagerResult<TState extends object, TActions extends object, TComputedProps, TContextValue = TMerged<{Context: React.Context<any>}, TMerged<TState, TActions>>>  = TContextValue & {contextValue: TContextValue};

// type TUseStateManagerResult<TState extends object, TActions extends object, TWatcherProps> = {
//   Context: React.Context<{state: TState, actions: TActions}>,
//   contextValue: {state: TState, actions: TActions},
//   state: TState,
//   actions: TActions,
//   watchedProps: TWatcherProps,
//   view: Omit<TState, keyof TActions> & TActions;
// }

type TMerged<T1,T2> = Omit<T1, keyof T2> & T2;
type TMergedTipple<T1,T2, T3> = TMerged<TMerged<T1, T2>, T3>;

export function applyReactiveWatcher<T>(observable: T, changed: Observable<unknown>, updater: Function, destoryed: Observable<unknown>, debug: string): T {
  const watchedProps = {};
  let prevState: object = {};
  const proxyObject = new Proxy({}, {
    get: (target, propName: string) => {
      const value = observable[propName];
      if (!propName.startsWith('_')) watchedProps[propName] = value;
      return value;
    }
  });

  function getState() {
    let currentState: Record<string, unknown> = {};
    Object.keys(watchedProps).forEach(propName => currentState[propName] = observable[propName]);
    return currentState;
  }


  let destroyedSubscription: Subscription;
  let unsubscribeVuex: Function;

  setTimeout(() => {
    prevState = getState();
    unsubscribeVuex = StatefulService.store.watch(
      () => {
        return Object.keys(watchedProps).map(propName => observable[propName]);
      },
      () => {
        console.log('vuex changed', debug );
        updater()
      }
    );
  }, 0);

  const changedSubscription = changed.subscribe(() => {
    console.log('verify', debug);
    const newState = getState();
    if (!isEqual(prevState, newState)) {
      Object.keys(prevState as object).forEach(key => {
        if (!isEqual(prevState![key], newState[key])) console.log('CHANGED', key);
      });
      prevState = newState;
      updater();
    } else {
      console.log('no changes');
    }
  });


  destroyedSubscription = destoryed.subscribe(() => {
    changedSubscription.unsubscribe();
    destroyedSubscription.unsubscribe();
    unsubscribeVuex();
  });

  return proxyObject as T;
}


type TConvertMutationToAction<TState, TMutation> = TMutation extends (state: TState, ...args: infer TArgs) => TState ? (...args: TArgs) => TState : never;
type TConvertMutationsToActions<TState, TMutations extends object, TMutationName extends keyof TMutations > = {[K in TMutationName]: TConvertMutationToAction<TState, TMutations[K]>}

export type TReducer<TState> = (state: TState, ...args: any[]) => TState;

export type TReducers<TState, TKey extends keyof any> = Record<TKey, TReducer<TState>>



// export type TReducers<TState, TReducerSet = {}> = TReducerSet extends Record<infer Key, TReducer<TState>> ? Record<Key, TReducer<TState>> : never;

// this method is only for typechecking
export function createReducers<TState, TReducersSet extends TReducers<TState, any>>(getState: () => TState, reducers: TReducersSet) {
  return reducers as TReducers<TState, keyof TReducersSet>;
}

export function createMutations<TState, TReducersSet extends Record<string, TReducer<TState>>, TMutationName extends keyof TReducersSet >(reducers: TReducersSet, getState: () => TState, setState: (newState: TState) => any): {[K in TMutationName]: TConvertMutationToAction<TState, TReducersSet[K]>}  {
  const mutations = {} as any;
  keys(reducers).forEach(key => {
    mutations[key] = (...args: any[]) => setState(reducers[key](getState(), ...args))
  });
  return mutations
}

type MState = {foo: number, bar: string};
const mutations = {
  updateFoo(state: MState, fooValue: number) {
    return state;
  },
  updateBar(state: MState, barValue: string) {
    return state;
  }
}

function getState(): MState {
  return {foo: 1, bar: 'bar'}
}

function setState(newState: MState) {
}

const acts = createMutations(mutations, getState, setState);
acts.updateBar('22')


// function combineWithComputed<TComputed, TState extends object>(watcher: (state: TState) => TComputed) {
//   const myState: TState = { a: 1, b: 2};
//   return { ...myState, ...watcher(myState));
// }


// export function applyReactiveWatcher<T>(observable: T, changed: Observable<unknown>): T {
//   const watchedProps = {};
//   // const ownPropsRef = useRef<any>({});
//   const [proxyObject] = useState(() => new Proxy({}, {
//     get: (target, propName: string) => {
//       // if (ownPropsRef.current[propName]) return ownPropsRef.current[propName];
//       const value = observable[propName];
//       if (!propName.startsWith('_')) watchedProps[propName] = value;
//       return value;
//     },
//     // set: (target, propName: string, val) => {
//     //   ownPropsRef.current[propName] = val;
//     //   return true;
//     // }
//   }));
//   const isInitialCall = useRef(true);
//   const [reactiveState, setReactiveState] = useState<any>(null);
//   useEffect(() => {
//     const subscription = changed.subscribe(() => {
//       console.log('something has been changed');
//       let newState: Record<string, unknown> = {};
//       Object.keys(watchedPropsRef.current).forEach(propName => newState[propName] = observable[propName]);
//       const prevState = reactiveState || watchedPropsRef.current;
//       if (!isEqual(prevState, newState)) {
//         console.log('Need to re-render', prevState, newState);
//         setReactiveState(observable);
//       }
//     });
//     isInitialCall.current = false;
//     return () => subscription.unsubscribe();
//   }, []);
//
//   return isInitialCall ? proxyObject as T : observable;
// }

//
//
// export type NonObjectKeysOf<T> = {
//   [K in keyof T]: T[K] extends Array<any> ? K : T[K] extends object ? never : K
// }[keyof T];
//
// export type ValuesOf<T> = T[keyof T];
// export type ObjectValuesOf<T extends Object> = Exclude<
//   Exclude<Extract<ValuesOf<T>, object>, never>,
//   Array<any>
//   >;
//
// export type UnionToIntersection<U> = (U extends any
//   ? (k: U) => void
//   : never) extends ((k: infer I) => void)
//   ? I
//   : never;
//
// type Flatten<T> = Pick<T, NonObjectKeysOf<T>> &
//   UnionToIntersection<ObjectValuesOf<T>>;


type TValueOrReturnType<T extends object> = T extends (...args: any[]) => infer R ? R : T;

const foo = {
  a: 1,
  b: 2,
}

const bar = function() {
 return {
   c: 1,
   d: 2
 }
};

const wee = mergeToProxy(bar, foo);


export function mergeToProxy<TObj1 extends object, TObj2 extends object>(obj1: TObj1, obj2: TObj2): Omit<TObj1, keyof TObj2> & TObj2 {
  const obj1MergedObjects = obj1['_mergedObjects'] || [obj1];
  const obj2MergedObjects = obj2['_mergedObjects'] || [obj2];
  const mergedObjects = [...obj1MergedObjects, ...obj2MergedObjects];
  const ownProps = {};
  return new Proxy(
    {},
    {
      get(t, propName: string) {
        if (propName === '_mergedObjects') {
          return  mergedObjects;
        }
        if (ownProps[propName]) return ownProps[propName];
        let targetObject: object | null = null;
        mergedObjects.slice().reverse().find(target => {
          const obj = typeof target === 'function' ? target() : target;
          if (obj.hasOwnProperty(propName) || obj.constructor?.prototype?.hasOwnProperty(propName)) {
            targetObject = obj;
            return true;
          }
        });
        if (targetObject) return targetObject[propName];
      },
      set: (target, propName: string, val) => {
        ownProps[propName] = val;
        return true;
      }
    },
  ) as  Omit<TObj1, keyof TObj2> & TObj2
}



function joinActionsAndViews<TActions extends object, TView extends object,
  TViews extends object,
  TViewName extends keyof TViews>(actions: TActions, views: TViews): TActions & Flatten<TViews> {
  return {} as any;
}

function act1(arg1: number) {
  return;
}

function act2(arg1: string) {
  return;
}

class MyView {
  foo: 'foo';
  bar: {
    zoom: '1',
  };
};

const myView = new MyView();

// let flatten: Flatten<typeof MyView>;
// const prot = MyView.prototype;
//
// const joined = mergeToProxy([{ act1, act2}, myView]);
// const joined2 = joinActionsAndViews({act1, act2}, [myView]);
// joined2.foo;
// joined2.act1;

// const a = [{foo: 1}, {bar: 2}];
// let fl: FlattenIfArray<typeof a>;
// fl.foo

export function useView() {

}
