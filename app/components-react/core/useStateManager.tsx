import React, { useContext, useEffect, useRef, useState } from 'react';
import { Observable, Subject, Subscription } from 'rxjs';
import { StatefulService } from '../../services';
import { cloneDeep, isPlainObject, mapKeys, remove } from 'lodash';
import { keys } from '../../services/utils';
import { useOnCreate } from '../hooks';
import { assertIsDefined } from '../../util/properties-type-guards';

type TStateManagerContext<TContextView extends object> = {
  contextView: TContextView;
  Context: typeof GenericStateManagerContext;
  stateWatcher: ReturnType<typeof createStateWatcher>;
  getLocalStateRevision(): number;
  getGlobalStateRevision(): number;
};

const GenericStateManagerContext = React.createContext(null);
let nextComponentId = 1;

export function useStateManager<
  TState extends object,
  TInitializerReturnType extends object,
  TContextView extends object = TMerge<TState, TInitializerReturnType>,
  TComputedPropsCb = ((contextView: TContextView) => any) | null,
  TComputedProps = TComputedPropsCb extends (...args: any[]) => infer R ? R : {},
  TComputedView extends object = TMerge<TContextView, TComputedProps>,
  TComponentView extends object = TMerge<
    TComputedView,
    {
      Context: React.Context<TStateManagerContext<TContextView>>;
      contextValue: TStateManagerContext<TContextView>;
    }
  >
>(
  initState: TState | (() => TState),
  initializer: (
    getState: () => TState,
    setState: (newState: TState) => void,
  ) => TInitializerReturnType,
  computedPropsCb: TComputedPropsCb,
  debug = false,
) {
  // return {
  //   initializerReturnType: {} as TInitializerReturnType,
  //   dependencyWatcher: {} as TComponentView,
  //   componentView: {} as TComponentView,
  //   contextView: {} as TContextView,
  //   computedProps: {} as TComputedProps,
  //   computedView: {} as TComputedView,
  //   isRoot: false,
  // };

  const localStateRevisionRef = useRef(1);
  const globalStateRevisionRef = useRef(1);
  const computedPropsRef = useRef<TComputedProps | null>(null);
  const updateCounterRef = useRef<number>(1);
  const [componentRevision, setComponentRevision] = useState(1);

  function updateComponent() {
    setComponentRevision(prevRev => prevRev + 1);
  }

  const context = useContext(GenericStateManagerContext) as React.Context<
    TStateManagerContext<TContextView>
  > | null;

  const { contextValue, isRoot } = useOnCreate(() => {
    if (context) {
      return {
        contextValue: (context as unknown) as TStateManagerContext<TContextView>,
        isRoot: false,
      };
    }

    // THIS CODE RUNS ONLY ONES PER CONTEXT

    let state: TState =
      typeof initState === 'function' ? (initState as Function)() : cloneDeep(initState);

    let localStateRevision = 1;
    const stateWatcher = createStateWatcher();

    function getState() {
      return state;
    }

    function setState(newState: TState) {
      state = newState;
      localStateRevision++;
      stateWatcher.handleLocalStateChange(localStateRevision);
    }

    const initializerView = initializer(getState, setState) as TInitializerReturnType;
    const contextView = (merge(state, initializerView) as unknown) as TContextView;

    function getLocalStateRevision() {
      return localStateRevision;
    }

    function getGlobalStateRevision() {
      return stateWatcher.getRevision();
    }

    const contextValue = {
      contextView,
      Context: React.createContext<TStateManagerContext<TContextView> | null>(null),
      stateWatcher,
      getLocalStateRevision,
      getGlobalStateRevision,
    } as TStateManagerContext<TContextView>;
    return { contextValue, isRoot: true };
  });

  const { contextView, stateWatcher } = contextValue;

  const {
    dependencyWatcher,
    componentId,
    onChange,
    calculateComputedProps,
    componentView,
  } = useOnCreate(() => {
    const componentId = debug
      ? `${nextComponentId++}_${getComponentName()}`
      : `${nextComponentId++}`;

    calculateComputedProps();
    const viewWithComputedProps = merge(contextView, () => computedPropsRef.current);

    const componentView = merge(viewWithComputedProps, {
      contextValue,
      Context: contextValue.Context,
    }) as TComponentView;

    const dependencyWatcher = createDependencyWatcher(componentView);

    function onChange(change: TStateChange) {
      const { globalStateRevision, localStateRevision } = change;
      if (globalStateRevision) {
        if (globalStateRevisionRef.current >= globalStateRevision) {
          console.log('vuex already updated ', componentId);
          return;
        }
        const { prevState, newState } = change;
        if (isSimilar(prevState, newState)) {
          console.log('vuex nothing changed', componentId);
          return;
        } else {
          console.log('vuex changed', componentId, prevState, newState);
          updateComponent();
        }
      } else if (localStateRevision) {
        if (localStateRevisionRef.current >= localStateRevision) {
          console.log('local already updated ', componentId);
          return;
        } else {
          const prevState = dependencyWatcher.getPrevState();
          const newState = pick(componentView, ...dependencyWatcher.getDependentFields());
          if (isSimilar(prevState, newState)) {
            console.log('local nothing changed', componentId);
            return;
          } else {
            console.log('local changed', componentId, prevState, newState);
            updateComponent();
          }
        }
      }
    }

    function calculateComputedProps(): TComputedProps {
      computedPropsRef.current =
        typeof computedPropsCb === 'function' ? computedPropsCb(contextView) : {};
      return computedPropsRef.current as TComputedProps;
    }

    return {
      componentView,
      componentId,
      onChange,
      dependencyWatcher,
      calculateComputedProps,
    };
  });

  localStateRevisionRef.current = contextValue.getLocalStateRevision();
  globalStateRevisionRef.current = contextValue.getLocalStateRevision();
  dependencyWatcher.savePrevState();
  if (debug) {
    if (updateCounterRef.current === 1) {
      console.log('Create component', componentId);
    } else {
      console.log('Update component', componentId);
    }
    updateCounterRef.current++;
  }

  useEffect(() => {
    const selector = () => {
      const dependentFields = dependencyWatcher.getDependentFields();
      return {
        ...pick(contextView, ...dependentFields),
        ...pick(calculateComputedProps, ...dependentFields),
      };
    };
    stateWatcher.subscribe({ componentId, onChange, selector });
    dependencyWatcher.savePrevState();
    if (isRoot) stateWatcher.startWatching();
    return () => {
      if (isRoot) stateWatcher.stopWatching();
      stateWatcher.unsubscribe(componentId);
    };
  }, []);

  return {
    dependencyWatcher: dependencyWatcher.watcherProxy as TComponentView,
    contextView: contextView as TContextView,
    componentView: componentView as TComponentView,
    isRoot,
  };
}

function createDependencyWatcher<T extends object>(watchedObject: T) {
  let prevState: Record<string, any> = {};
  const dependencies: Record<string, any> = {};
  const watcherProxy = new Proxy(
    { _proxyName: 'DependencyWatcher' },
    {
      get: (target, propName: string) => {
        if (propName in target) return target[propName];
        const value = watchedObject[propName];
        dependencies[propName] = value;
        return value;
      },
    },
  ) as T;

  function getDependentFields() {
    return Object.keys(dependencies);
  }

  function savePrevState() {
    prevState = { ...dependencies };
  }

  function getPrevState() {
    return prevState;
  }

  return { watcherProxy, getDependentFields, getPrevState, savePrevState };
}

function createStateWatcher() {
  type TComponentId = string;
  type TSubscription = {
    componentId: TComponentId;
    selector: Function;
    onChange: (change: TStateChange) => unknown;
  };
  const vuexStore = StatefulService.store;
  const subscriptions: TSubscription[] = [];
  let stateRevision = 1;
  let isWatching = false;
  let unsubscribeVuex: Function;

  function subscribe(subscription: TSubscription) {
    subscriptions.push(subscription);
    subscriptions.sort((s1, s2) => (s1.componentId > s2.componentId ? 1 : -1));
    if (isWatching) {
      stopWatching();
      startWatching();
    }
  }

  function unsubscribe(componentId: string) {
    remove(subscriptions, s => s.componentId !== componentId);
    if (isWatching) {
      stopWatching();
      startWatching();
    }
  }

  function startWatching() {
    function getPrefixedField(componentId: string, fieldName: string) {
      return `${componentId}__${fieldName}`;
    }

    function getUnprefixed(prefixedField: string) {
      return prefixedField.split('__') as [string, string];
    }

    function getPrefixedState(subscr: TSubscription) {
      const componentState = subscr.selector();
      return mapKeys(componentState, (value, key) => getPrefixedField(subscr.componentId, key));
    }

    unsubscribeVuex = vuexStore.watch(
      () => {
        // create one cb for all subscribed components
        const mixedState: object = {};
        const prefixedStates = subscriptions.map(getPrefixedState);
        prefixedStates.forEach(state => Object.assign(mixedState, state));
        return mixedState;
      },
      (newState, prevState) => {
        stateRevision++;
        // walk through newState and generate a `changes` object with newState and prevState
        // for each component
        const changes: Record<TComponentId, { newState: object; prevState: object }> = {};
        Object.keys(newState).forEach(prefixedField => {
          const newVal = newState[prefixedField];
          const prevVal = prevState[prefixedField];
          const [componentId, fieldName] = getUnprefixed(prefixedField);
          const componentPrevState = changes[componentId]?.prevState || {};
          const componentNewState = changes[componentId]?.newState || {};
          componentPrevState[fieldName] = prevVal;
          componentNewState[fieldName] = newVal;
          changes[componentId] = { newState: componentNewState, prevState: componentPrevState };
        });

        // walk through components and emit onChange
        subscriptions.forEach(subscr => {
          const { newState, prevState } = changes[subscr.componentId];
          subscr.onChange({ newState, prevState, globalStateRevision: stateRevision });
        });
      },
    );
    isWatching = true;
  }

  function stopWatching() {
    unsubscribeVuex();
    isWatching = false;
  }

  function handleLocalStateChange(localStateRevision: number) {
    // walk through components and emit onChange
    subscriptions.forEach(subscr => {
      subscr.onChange({ localStateRevision });
    });
  }

  function getRevision(): number {
    return stateRevision;
  }

  return {
    startWatching,
    stopWatching,
    subscribe,
    unsubscribe,
    handleLocalStateChange,
    getRevision,
  };
}
type TStateChange = {
  newState?: unknown;
  prevState?: unknown;
  globalStateRevision?: number;
  localStateRevision?: number;
};

// consider isSimilar as isDeepEqual with depth 2
// depth 2 should be enough for the most cases
function isSimilar(obj1: any, obj2: any) {
  return isDeepEqual(obj1, obj2, 0, 2);
}

function isDeepEqual(obj1: any, obj2: any, currentDepth: number, maxDepth: number) {
  if (obj1 === obj2) return true;
  if (currentDepth === maxDepth) return false;
  if (Array.isArray(obj1) && Array.isArray(obj2)) isArrayEqual(obj1, obj2);
  if (isPlainObject(obj1) && isPlainObject(obj2)) {
    const [keys1, keys2] = [Object.keys(obj1), Object.keys(obj2)];
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
      if (!isDeepEqual(obj1[key], obj2[key], currentDepth + 1, maxDepth)) return false;
    }
    return true;
  }
  return false;
}

function isArrayEqual(a: any[], b: any[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function pick<T extends object>(obj: T, ...props: Array<string>): Partial<T> {
  const result: any = {};
  props.forEach(prop => {
    const propName = prop as string;
    if (obj.hasOwnProperty(propName)) result[propName] = obj[propName];
  });
  return result as Partial<T>;
}

function useDepWatch() {
  const result = useStateManager(
    () => ({ foo: '1', bar: 2 }),
    (getState, setState) => {
      return {
        setFoo(foo: string) {
          setState({ ...getState(), foo });
        },
        setBar(bar: number) {
          setState({ ...getState(), bar });
        },
      };
    },
    v => {
      return { fooBar: v.foo + v.bar };
    },
  );
  // result.initializerReturnType;
  // result.contextView;
  // result.computedProps;
  result.dependencyWatcher;
  result.componentView;
}

/**
 * Get component name from the callstack
 * Use for debugging only
 */
function getComponentName(): string {
  try {
    throw new Error();
  } catch (e) {
    return e.stack
      .split('\n')[9]
      .split('at ')[1]
      .split('(')[0]
      .trim();
  }
}

type TUseStateManagerResult<
  TState extends object,
  TActions extends object,
  TComputedProps,
  TContextValue = TMerge<{ Context: React.Context<any> }, TMerge<TState, TActions>>
> = TContextValue & { contextValue: TContextValue };

// type TUseStateManagerResult<TState extends object, TActions extends object, TWatcherProps> = {
//   Context: React.Context<{state: TState, actions: TActions}>,
//   contextValue: {state: TState, actions: TActions},
//   state: TState,
//   actions: TActions,
//   watchedProps: TWatcherProps,
//   view: Omit<TState, keyof TActions> & TActions;
// }

export type TMerge<
  T1,
  T2,
  TObj1 = T1 extends (...args: any[]) => infer R1 ? R1 : T1,
  TObj2 = T2 extends (...args: any[]) => infer R2 ? R2 : T2,
  R extends object = Omit<TObj1, keyof TObj2> & TObj2
> = R;

type TMerge3<T1, T2, T3> = TMerge<TMerge<T1, T2>, T3>;

// export type TMerge<T1, T2, R extends object = Omit<T1, keyof T2> & T2> = R;
type TMergedTipple<T1, T2, T3> = TMerge<TMerge<T1, T2>, T3>;

type Tbar = { one: '1' };
type Tfoo = { second: '2' };
type TZoo = () => { third: '3' };
type TRes = TMerge<Tbar, TZoo>;
type TForceObj<T> = T extends object ? object : void;

type TFine = TForceObj<TRes>;

//
// export function applyReactiveWatcher<T>(
//   observable: T,
//   changed: Observable<unknown>,
//   updater: Function,
//   destoryed: Observable<unknown>,
//   debug: string,
// ): T {
//   const watchedProps = {};
//   let prevState: object = {};
//   const proxyObject = new Proxy(
//     {},
//     {
//       get: (target, propName: string) => {
//         const value = observable[propName];
//         if (!propName.startsWith('_')) watchedProps[propName] = value;
//         return value;
//       },
//     },
//   );
//
//   function getState() {
//     const currentState: Record<string, unknown> = {};
//     Object.keys(watchedProps).forEach(propName => (currentState[propName] = observable[propName]));
//     return currentState;
//   }
//
//   let destroyedSubscription: Subscription;
//   let unsubscribeVuex: Function;
//
//   setTimeout(() => {
//     prevState = getState();
//     unsubscribeVuex = StatefulService.store.watch(
//       () => {
//         return Object.keys(watchedProps).map(propName => observable[propName]);
//       },
//       () => {
//         console.log('vuex changed', debug);
//         updater();
//       },
//     );
//   }, 0);
//
//   const changedSubscription = changed.subscribe(() => {
//     console.log('verify', debug);
//     const newState = getState();
//     if (!isEqual(prevState, newState)) {
//       Object.keys(prevState as object).forEach(key => {
//         if (!isEqual(prevState![key], newState[key])) console.log('CHANGED', key);
//       });
//       prevState = newState;
//       updater();
//     } else {
//       console.log('no changes');
//     }
//   });
//
//   destroyedSubscription = destoryed.subscribe(() => {
//     changedSubscription.unsubscribe();
//     destroyedSubscription.unsubscribe();
//     unsubscribeVuex();
//   });
//
//   return proxyObject as T;
// }

type TConvertMutationToAction<TState, TMutation> = TMutation extends (
  state: TState,
  ...args: infer TArgs
) => TState
  ? (...args: TArgs) => TState
  : never;
type TConvertMutationsToActions<
  TState,
  TMutations extends object,
  TMutationName extends keyof TMutations
> = { [K in TMutationName]: TConvertMutationToAction<TState, TMutations[K]> };

export type TReducer<TState> = (state: TState, ...args: any[]) => TState;

export type TReducers<TState, TKey extends keyof any> = Record<TKey, TReducer<TState>>;

// export type TReducers<TState, TReducerSet = {}> = TReducerSet extends Record<infer Key, TReducer<TState>> ? Record<Key, TReducer<TState>> : never;

// this method is only for typechecking
export function createReducers<TState, TReducersSet extends TReducers<TState, any>>(
  getState: () => TState,
  reducers: TReducersSet,
) {
  return reducers as TReducers<TState, keyof TReducersSet>;
}

export function createMutations<
  TState,
  TReducersSet extends Record<string, TReducer<TState>>,
  TMutationName extends keyof TReducersSet
>(
  reducers: TReducersSet,
  getState: () => TState,
  setState: (newState: TState) => any,
): { [K in TMutationName]: TConvertMutationToAction<TState, TReducersSet[K]> } {
  const mutations = {} as any;
  keys(reducers).forEach(key => {
    mutations[key] = (...args: any[]) => setState(reducers[key](getState(), ...args));
  });
  return mutations;
}

type MState = { foo: number; bar: string };
const mutations = {
  updateFoo(state: MState, fooValue: number) {
    return state;
  },
  updateBar(state: MState, barValue: string) {
    return state;
  },
};

function getState(): MState {
  return { foo: 1, bar: 'bar' };
}

function setState(newState: MState) {}

const acts = createMutations(mutations, getState, setState);
acts.updateBar('22');

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
};

const bar = function() {
  return {
    c: 1,
    d: 2,
  };
};

const wee = merge(bar, foo);

export function merge<TObj1 extends object, TObj2 extends object>(
  obj1: TObj1,
  obj2: TObj2,
): TMerge<TObj1, TObj2> {
  const obj1MergedObjects = obj1['_mergedObjects'] || [obj1];
  const obj2MergedObjects = obj2['_mergedObjects'] || [obj2];
  const mergedObjects = [...obj1MergedObjects, ...obj2MergedObjects];
  const metadata = {
    _proxyName: 'MergeResult',
    _cache: {},
    _mergedObjects: mergedObjects,
  };

  function getTargetValue(target: object | Function, propName: string) {
    return typeof target === 'function' ? target()[propName] : target[propName];
  }

  function findTarget(propName: string) {
    if (propName in metadata._cache) {
      const target = metadata._cache[propName];
      return target;
    }

    return mergedObjects
      .slice()
      .reverse()
      .find(target => {
        const obj = typeof target === 'function' ? target() : target;
        if (obj.hasOwnProperty(propName) || obj.constructor?.prototype?.hasOwnProperty(propName)) {
          metadata._cache[propName] = target;
          return true;
        }
      });
  }

  return (new Proxy(metadata, {
    get(t, propName: string) {
      if (propName === 'hasOwnProperty') return (propName: string) => !!findTarget(propName);
      if (propName in metadata) return metadata[propName];
      const target = findTarget(propName);
      if (!target) return;
      return target[propName];
    },
    set: (target, propName: string, val) => {
      metadata[propName] = val;
      return true;
    },
  }) as unknown) as TMerge<TObj1, TObj2>;
}

function joinActionsAndViews<
  TActions extends object,
  TView extends object,
  TViews extends object,
  TViewName extends keyof TViews
>(actions: TActions, views: TViews): TActions & Flatten<TViews> {
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
    zoom: '1';
  };
}

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

export function useView() {}

type Flatten<T> = T extends (infer R)[] ? R : never;
