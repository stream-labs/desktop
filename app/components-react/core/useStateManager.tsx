import React, { useContext, useEffect, useRef } from 'react';
import { StatefulService } from '../../services';
import { cloneDeep, isPlainObject, mapKeys, remove } from 'lodash';
import { keys } from '../../services/utils';
import { useForceUpdate, useOnCreate } from '../hooks';

type TStateManagerContext<TContextView extends object> = {
  contextView: TContextView;
  Context: typeof GenericStateManagerContext;
  stateWatcher: ReturnType<typeof createStateWatcher>;
  getLocalStateRevision(): number;
  getGlobalStateRevision(): number;
};

const GenericStateManagerContext = React.createContext(null);
let nextComponentId = 1;

/**
 * Manage the state in React.Context
 * Use it when you have a complex state that you need to share between several components via React.context
 */
export function useStateManager<
  TState extends object, // state type
  TInitializerReturnType extends object, // getters, mutations, actions and views related to the state
  TContextView extends object = TMerge<TState, TInitializerReturnType>, // state + everything from the initializer
  TComputedPropsCb = ((contextView: TContextView) => any) | null, // function for calculating the computed props
  TComputedProps = TComputedPropsCb extends (...args: any[]) => infer R ? R : {}, // computed props type
  TComputedView extends object = TMerge<TContextView, TComputedProps>, // state + initializer + computed props
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
  // keep revision numbers for local and global (vuex) state
  // we need this numbers to check if component is synced with the last state
  const localStateRevisionRef = useRef(1);
  const globalStateRevisionRef = useRef(1);

  // keep computed props in ref
  const computedPropsRef = useRef<TComputedProps | null>(null);

  // true if component is destroyed
  const isDestroyedRef = useRef<boolean>(false);

  // current update counter, needed in the debug mode
  const updateCounterRef = useRef<number>(1);

  const forceUpdate = useForceUpdate();
  const context = useContext(GenericStateManagerContext) as React.Context<
    TStateManagerContext<TContextView>
  > | null;

  // get current React.Context or create new if not exist
  const { contextValue, isRoot } = useOnCreate(() => {
    // the context exists just
    if (context) {
      return {
        contextValue: (context as unknown) as TStateManagerContext<TContextView>,
        isRoot: false,
      };
    }

    // context is not found we should create a new one
    // THIS CODE RUNS ONLY ONES PER CONTEXT

    // create initial state
    let state: TState =
      typeof initState === 'function' ? (initState as Function)() : cloneDeep(initState);
    // the local state revision number, this number will be increased after each state mutation
    let localStateRevision = 1;

    // create StateWatcher to observe changes from vuex
    // and update depending components
    const stateWatcher = createStateWatcher(debug);

    // CREATE STATE GETTER AND SETTER

    function getState() {
      return state;
    }

    function setState(newState: TState) {
      const prevState = state;
      state = newState;
      localStateRevision++;
      stateWatcher.handleLocalStateChange(localStateRevision, prevState, newState);
    }

    // create getters/mutations/actions
    const initializerView = initializer(getState, setState) as TInitializerReturnType;
    // merge it with state
    const contextView = merge(getState, initializerView) as TContextView;

    // CREATE GETTERS FOR LOCAL AND GLOBAL REVISIONS

    function getLocalStateRevision() {
      return localStateRevision;
    }

    function getGlobalStateRevision() {
      return stateWatcher.getRevision();
    }

    // new React.Context is ready
    const contextValue = {
      contextView,
      Context: GenericStateManagerContext as React.Context<TStateManagerContext<
        TContextView
      > | null>,
      stateWatcher,
      getLocalStateRevision,
      getGlobalStateRevision,
    } as TStateManagerContext<TContextView>;
    return { contextValue, isRoot: true };
  });

  const { contextView, stateWatcher } = contextValue;

  // handle component creation
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

    // computed props are unique for each component
    // calculate them and merge with ContextView
    calculateComputedProps();
    const viewWithComputedProps = merge(contextView, () => computedPropsRef.current);

    // prepare Context and contextValue for the component
    const componentView = merge(viewWithComputedProps, {
      contextValue,
      Context: contextValue.Context,
    }) as TComponentView;

    // create a dependency watcher for the component
    // to track which state properties or getters does component use
    // and update the component only if it's dependencies have been changed
    const dependencyWatcher = createDependencyWatcher(componentView);

    // define a onChange handler
    // when StateWatcher detects changes in store or local state this function will be called
    function onChange(change: TStateChange) {
      // do not handle unmounted components
      if (isDestroyedRef.current) return;

      const { globalStateRevision, localStateRevision } = change;

      if (
        (globalStateRevision && globalStateRevisionRef.current >= globalStateRevision) ||
        (localStateRevision && localStateRevisionRef.current >= localStateRevision)
      ) {
        // component is already up to date
        return;
      }

      // handle vuex state change
      if (globalStateRevision) {
        const { prevState, newState } = change;
        if (isSimilar(prevState, newState)) {
          // the state is not changed
          return;
        } else {
          // the state has been changed, update the component
          if (debug) logChange(prevState, newState, componentId, true, globalStateRevision);
          forceUpdate();
        }

      // handle local state changes inside React.Context
      } else if (localStateRevision) {
        calculateComputedProps();
        const prevState = dependencyWatcher.getPrevState();
        const newState = pick(componentView, ...dependencyWatcher.getDependentFields());
        if (isSimilar(prevState, newState)) {
          // prevState and newState are equal, no action needed
          return;
        } else {
          // prevState and newState are not equal, update the component
          if (debug) logChange(prevState, newState, componentId, false, localStateRevision);
          forceUpdate();
        }
      }
    }

    // calculate computed props and save them in the ref object
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

  // sync revisions for the each component update cycle
  localStateRevisionRef.current = contextValue.getLocalStateRevision();
  globalStateRevisionRef.current = contextValue.getGlobalStateRevision();
  dependencyWatcher.savePrevState();


  // log lifecycle if in the debug mode
  if (debug) {
    if (updateCounterRef.current === 1) {
      console.log('Create component', componentId);
    } else {
      console.log('Update component', componentId);
    }
    updateCounterRef.current++;
  }

  // start watching for local and global state change after the component mounted
  useEffect(() => {
    // create a state selector to watch state from vuex
    const selector = () => {
      // we should watch only component's dependencies
      const dependentFields = dependencyWatcher.getDependentFields();
      return {
        ...pick(contextView, ...dependentFields),
        ...pick(calculateComputedProps(), ...dependentFields),
      };
    };
    stateWatcher.subscribe({ componentId, onChange, selector });
    dependencyWatcher.savePrevState();

    // tell StateWatcher to start watching if the root component is mounted
    if (isRoot) stateWatcher.startWatching();

    // handle unmount
    return () => {
      // tell StateWatcher to stop watching if the root component is unmounted
      if (isRoot) stateWatcher.stopWatching();
      // unsubscribe the component from the state watcher and mark it as destroyed
      stateWatcher.unsubscribe(componentId);
      isDestroyedRef.current = true;
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

  // TODO: move to StateManager
  function savePrevState() {
    prevState = pick(watchedObject, ...getDependentFields());
  }

  function getPrevState() {
    return prevState;
  }

  return { watcherProxy, getDependentFields, getPrevState, savePrevState };
}

function createStateWatcher(debug = false) {
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
      console.log('Subscribe and rebuild state watcher', subscription.componentId);
      stopWatching();
      startWatching();
    }
  }

  function unsubscribe(componentId: string) {
    remove(subscriptions, s => s.componentId === componentId);
    if (isWatching) {
      stopWatching();
      startWatching();
    }
  }

  function startWatching() {
    console.log('start watching');
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
        if (debug) logMutation(stateRevision, prevState, newState, true);
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

        const currentSubscriptions = subscriptions.slice();
        isWatching = false;
        // walk through components and emit onChange
        currentSubscriptions.forEach(subscr => {
          const { newState, prevState } = changes[subscr.componentId];
          subscr.onChange({ newState, prevState, globalStateRevision: stateRevision });
        });

        const prevSubscriptionIds = currentSubscriptions.map(s => s.componentId);
        const newSubscriptionIds = subscriptions.map(s => s.componentId);
        const shouldResubscribeVuex = !isArrayEqual(prevSubscriptionIds, newSubscriptionIds);

        if (shouldResubscribeVuex) {
          stopWatching();
          startWatching();
        } else {
          isWatching = true;
        }

      },
    );
    isWatching = true;
  }

  function stopWatching() {
    unsubscribeVuex();
    isWatching = false;
  }

  function handleLocalStateChange(localStateRevision: number, prevState: any, newState: any) {
    // walk through components and emit onChange
    if (debug) logMutation(localStateRevision, prevState, newState, false);
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
  if (Array.isArray(obj1) && Array.isArray(obj2)) return isArrayEqual(obj1, obj2);
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

function pick<T extends Object>(obj: T, ...props: Array<string>): Partial<T> {
  const result: any = {};
  props.forEach(prop => {
    const propName = prop as string;
    if (obj.hasOwnProperty(propName)) result[propName] = obj[propName];
  });
  return result as Partial<T>;
}

function getDiff(prevState: any, newState: any) {
  const changedFields = Object.keys(newState).filter(key => !isSimilar(newState[key], prevState[key]));
  const diff = {};
  changedFields.forEach(key => diff[key] = ({ prevState: prevState[key], newState: newState[key] }));
  return diff;
}

function logChange(prevState: any, newState: any, componentId: string, isGlobalState: boolean, revision: number) {
  const mutationType = isGlobalState ? 'global' : 'local';
  const diff = getDiff(prevState, newState);
  const triggeredByMsg = `Triggered by ${mutationType} mutation #${revision}`;
  console.log('Should update component', componentId, triggeredByMsg, '. Diff:', diff);
}

function logMutation(revision: number, prevState: any, newState: any, isGlobal: boolean) {
  const mutationType = isGlobal ? 'global' : 'local';
  const diff = getDiff(prevState, newState);
  console.log(`New ${mutationType} mutation # ${revision}. Diff:`, diff);
}

//
// function useDepWatch() {
//   const result = useStateManager(
//     () => ({ foo: '1', bar: 2 }),
//     (getState, setState) => {
//       return {
//         setFoo(foo: string) {
//           setState({ ...getState(), foo });
//         },
//         setBar(bar: number) {
//           setState({ ...getState(), bar });
//         },
//       };
//     },
//     v => {
//       return { fooBar: v.foo + v.bar };
//     },
//   );
//   // result.initializerReturnType;
//   // result.contextView;
//   // result.computedProps;
//   result.dependencyWatcher;
//   result.componentView;
// }

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

export type TMerge<
  T1,
  T2,
  TObj1 = T1 extends (...args: any[]) => infer R1 ? R1 : T1,
  TObj2 = T2 extends (...args: any[]) => infer R2 ? R2 : T2,
  R extends object = Omit<TObj1, keyof TObj2> & TObj2
> = R;

type TMerge3<T1, T2, T3> = TMerge<TMerge<T1, T2>, T3>;

type TConvertMutationToAction<TState, TMutation> = TMutation extends (
  state: TState,
  ...args: infer TArgs
) => TState
  ? (...args: TArgs) => TState
  : never;

export type TReducer<TState> = (state: TState, ...args: any[]) => TState;

export type TReducers<TState, TKey extends keyof any> = Record<TKey, TReducer<TState>>;

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

    const target = mergedObjects
      .slice()
      .reverse()
      .find(target => {
        const obj = typeof target === 'function' ? target() : target;
        if (obj.hasOwnProperty(propName) || obj.constructor?.prototype?.hasOwnProperty(propName)) {
          return true;
        }
      });
    metadata._cache[propName] = target;
    return target;
  }

  return (new Proxy(metadata, {
    get(t, propName: string) {
      if (propName === 'hasOwnProperty') return (propName: string) => !!findTarget(propName);
      if (propName in metadata) return metadata[propName];
      const target = findTarget(propName);
      if (!target) return;
      return getTargetValue(target, propName);
    },
    set: (target, propName: string, val) => {
      metadata[propName] = val;
      return true;
    },
  }) as unknown) as TMerge<TObj1, TObj2>;
}
