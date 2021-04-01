import React, { useContext, useEffect, useRef } from 'react';
import { StatefulService } from '../../services';
import { cloneDeep, isPlainObject, mapKeys, remove } from 'lodash';
import { keys } from '../../services/utils';
import { useForceUpdate, useOnCreate, useOnDestroy } from '../hooks';
import { unstable_batchedUpdates } from 'react-dom'; // that is what Redux use for batched updates

type TStateManagerContext<TContextView extends object> = {
  contextView: TContextView;
  Context: typeof GenericStateManagerContext;
  dispatcher: TDispatcher<unknown, unknown>
  stateWatcher: ReturnType<typeof createStateWatcher>;
};

const GenericStateManagerContext = React.createContext(null);
let nextComponentId = 1;

const DEBUG = true;

/**
 * Manages the state in React.Context
 * Use it when you have a complex state that depends on Vuex as an alternative for React.useReducer
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
) {
  // get component id and itinialize loger for the debug mode
  const componentId = useComponentId();
  useLogLifecycle(componentId);

  // initialize React.Context or create a new one if not exist
  const context = useContext(GenericStateManagerContext) as React.Context<
    TStateManagerContext<TContextView>
    > | null;

  const { contextValue, isRoot } = useOnCreate(() => {
    // the context already exists, use it
    if (context) {
      return {
        contextValue: (context as unknown) as TStateManagerContext<TContextView>,
        isRoot: false,
      };
    }

    // context is not found, create a new one
    return { contextValue: createContext(initState, initializer), isRoot: true };
  });

  // now working on a component instance

  // keep revision numbers for local and global (vuex) states
  // we need this numbers to check if component is synced with the last state
  const localStateRevisionRef = useRef(1);
  const globalStateRevisionRef = useRef(1);

  // keep computed props in ref
  const computedPropsRef = useRef<TComputedProps | null>(null);

  // save the previous component state in ref
  const prevComponentState = useRef<Partial<TComponentView> | null>(null);

  // true if component is destroyed
  const isDestroyedRef = useRef<boolean>(false);

  // we keep state is refs so we need to manually update components when it's changed
  const forceUpdate = useForceUpdate();


  // handle component creation
  const {
    dependencyWatcher,
    onChange,
    vuexSelector,
    componentView,
  } = useOnCreate(() => {
    const { contextView } = contextValue;

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
    // to track which state properties or getters does the component use
    // and update the component only if it's dependencies have been changed
    const dependencyWatcher = createDependencyWatcher(componentView);

    // define a onChange handler
    // when StateWatcher detects changes in store or local state this function will be called
    function onChange(change: TStateChange) {
      const { globalStateRevision, localStateRevision } = change;

      // handle vuex state change
      if (globalStateRevision) {
        const { prevState, newState } = change;
        if (isSimilar(prevState, newState)) {
          // the state is not changed
          return;
        } else {
          // the state has been changed, update the component
          if (DEBUG) logChange(prevState, newState, componentId, true, globalStateRevision);
          forceUpdate();
        }

      // handle local state changes inside React.Context
      } else if (localStateRevision) {
        calculateComputedProps();
        const prevState = prevComponentState.current;
        const newState = pick(componentView, ...dependencyWatcher.getDependentFields());
        if (isSimilar(prevState, newState)) {
          // prevState and newState are equal, no action needed
          return;
        } else {
          // prevState and newState are not equal, update the component
          if (DEBUG) logChange(prevState, newState, componentId, false, localStateRevision);
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

    // create a state selector for watching state from vuex
    function vuexSelector() {
      // we should watch only component's dependencies
      const dependentFields = dependencyWatcher.getDependentFields();
      return {
        ...pick(contextView, ...dependentFields),
        ...pick(calculateComputedProps(), ...dependentFields),
      };
    }

    return {
      componentView,
      onChange,
      dependencyWatcher,
      calculateComputedProps,
      vuexSelector
    };
  });

  // sync revisions for the each component update cycle
  localStateRevisionRef.current = contextValue.dispatcher.getRevision();
  globalStateRevisionRef.current = contextValue.stateWatcher.getRevision();

  const { stateWatcher } = contextValue;
  stateWatcher.registerComponent(
    componentId,
    vuexSelector,
    onChange,
    () => globalStateRevisionRef.current,
    () => localStateRevisionRef.current,
    () => isDestroyedRef.current,
  );
  useEffect(() => {
    prevComponentState.current = pick(
      componentView,
      ...dependencyWatcher.getDependentFields()
    );
    stateWatcher.startWatching(componentId);
  });

  useOnDestroy(() => {
    isDestroyedRef.current = true;
    stateWatcher.unregisterComponent(componentId);
  })

  return {
    dependencyWatcher: dependencyWatcher.watcherProxy as TComponentView,
    contextView: contextValue.contextView as TContextView,
    componentView: componentView as TComponentView,
    isRoot,
  };
}

function createContext<TState, TActions extends Object, TContextView extends TMerge<TState, TActions>>(
  initState: TState | (() => TState),
  actionsCreator: (getState: () => TState, setState: (newState: TState) => unknown ) => TActions)
{

  // create initial state
  let state: TState =
    typeof initState === 'function' ? (initState as Function)() : cloneDeep(initState);

  // create a local state and dispatcher
  const dispatcher = createDispatcher(state, actionsCreator)

  // create StateWatcher to observe changes from the local state and vuex
  // and update dependent components
  const stateWatcher = createStateWatcher(dispatcher);

  // merge it with state
  const contextView = merge(dispatcher.getState, dispatcher.actions) as TContextView;

  // new React.Context is ready
  return {
    contextView,
    Context: GenericStateManagerContext as React.Context<TStateManagerContext<
      TContextView
      > | null>,
    dispatcher,
    stateWatcher,
  } as TStateManagerContext<TContextView>;
}

/**
 * Returns unique component
 * If DEBUG=true then the componentId includes a component name
 */
function useComponentId() {

  /**
   * Get component name from the callstack
   * Use for debugging only
   */
  function getComponentName(): string {
    try {
      throw new Error();
    } catch (e) {
      return e.stack
        .split('\n')[10]
        .split('at ')[1]
        .split('(')[0]
        .trim();
    }
  }

  return useOnCreate(() => {
    return DEBUG ? `${nextComponentId++}_${getComponentName()}` : `${nextComponentId++}`
  });
}

/**
 * Tracks read operations on the object
 *
 * @example
 *
 * const myObject = { foo: 1, bar: 2, qux: 3};
 * const { watcherProxy, getDependentFields } = createDependencyWatcher(myObject);
 * const { foo, bar } = watcherProxy;
 * getDependentFields(); // returns ['foo', 'bar'];
 *
 */
function createDependencyWatcher<T extends object>(watchedObject: T) {
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

  return { watcherProxy, getDependentFields };
}

function createStateWatcher(
  dispatcher: TDispatcher<unknown, unknown>,
  debug = false
) {
  type TComponentId = string;
  type TSubscription = {
    componentId: TComponentId;
    sequence: number;
    checkIsDestroyed(): boolean;
    getGlobalStateRevision(): number;
    getLocalStateRevision(): number;
    isReady: boolean,
    selector: Function;
    onChange: (change: TStateChange) => unknown;
  };
  const components: Record<TComponentId, TSubscription> = {}
  const vuexStore = StatefulService.store;
  let watchedComponentsIds: string[] = [];
  // TODO: remove
  let vuexGetterRevision = 0;
  let stateRevision = 0;
  let isWatching = false;
  let unsubscribeVuex: Function | null = null;

  dispatcher.subscribe((newState, revision) => {
    if (DEBUG) logMutation(revision, null, newState, false);
    getComponents().forEach(component => {
      if (component.checkIsDestroyed()) return;
      if (component.getLocalStateRevision() >= revision) return;
      component.onChange({localStateRevision: revision});
    });
  });

  function checkIsRegistered(componentId: string): boolean {
    return componentId in components;
  }

  function registerComponent(
    componentId: string,
    selector: Function,
    onChange: (change: TStateChange) => unknown,
    getGlobalStateRevision: () => number,
    getLocalStateRevision: () => number,
    checkIsDestroyed: () => boolean
  ) {
    if (!checkIsRegistered(componentId)) {
      const sequence = Number(componentId.split('_')[0]);
      components[componentId] = { componentId, sequence, selector, onChange, getGlobalStateRevision, getLocalStateRevision, checkIsDestroyed, isReady: false };
    } else {
      components[componentId].isReady = false;
    }
  }

  function startWatching(componentId: string) {
    // mark component as ready to receiving state updates
    components[componentId].isReady = true;

    // if some component is not in the ready state, then just exit
    const hasPendingComponents = Object.keys(components).find(id => !components[id].isReady);
    if (hasPendingComponents) return;

    // it's the last component that was in unready state
    // check if we should restart vuex watcher now
    const registeredComponentIds = getComponents().map(c => c.componentId);
    if (!isArrayEqual(watchedComponentsIds, registeredComponentIds)) {
      stopWatchingVuex();
      watchVuex(createVuexGetter());
    }
  }

  function unregisterComponent(componentId: string) {
    delete components[componentId];
  }

  function createVuexGetter() {
    vuexGetterRevision++;
    watchedComponentsIds = getComponents().map(comp => comp.componentId);
    return () => {
      // create one cb for all subscribed components
      const mixedState: Record<string, any> = {};
      const prefixedStates = getComponents().map(comp => {
        const componentState = comp.selector();
        return mapKeys(componentState, (value, key) => getPrefixedField(comp.componentId, key))
      });
      prefixedStates.forEach(state => Object.assign(mixedState, state));
      mixedState.vuexGetterRevision = vuexGetterRevision;
      return mixedState;
    }
  }

  function watchVuex(vuexGetter: () => Object) {
    unsubscribeVuex = vuexStore.watch(
      vuexGetter,
      (newState, prevState) => {
        stateRevision++;
        if (DEBUG) logMutation(stateRevision, prevState, newState, true);
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


        const currentRevision = stateRevision;
        getComponents().forEach(component => {
          if (component.checkIsDestroyed()) return;
          if (component.getGlobalStateRevision() >= currentRevision) return;
          const { newState, prevState } = changes[component.componentId];
          component.onChange({ newState, prevState, globalStateRevision: currentRevision });
        });
      },
    );
    isWatching = true;
    log('subscribed to vuex');
  }

  function stopWatchingVuex() {
    unsubscribeVuex && unsubscribeVuex();
    unsubscribeVuex = null;
    watchedComponentsIds = [];
    isWatching = false;
  }


  function getPrefixedField(componentId: string, fieldName: string) {
    return `${componentId}__${fieldName}`;
  }

  function getUnprefixed(prefixedField: string) {
    return prefixedField.split('__') as [string, string];
  }

  function getComponents() {
    return Object.keys(components)
      .sort((id1, id2) => components[id1].sequence - components[id2].sequence)
      .map(id => {
        return components[id] as Required<TSubscription>;
      });
  }

  function getRevision(): number {
    return stateRevision;
  }

  return {
    registerComponent,
    unregisterComponent,
    startWatching,
    getRevision,
  };
}
type TStateChange = {
  newState?: unknown;
  prevState?: unknown;
  globalStateRevision?: number;
  localStateRevision?: number;
};

/**
 * Create a local state with actions
 * and allow to subscribe on changes
 */
function createDispatcher<TState, TActions extends Object>(
  initialState: TState,
  actionCreators: (getState: () => TState, setState: (newState: TState) => unknown ) => TActions,
): TDispatcher<TState, TActions> {

  // the local state revision number, this number will be increased after each state mutation
  let localStateRevision = 0;
  function getRevision() {
    return localStateRevision;
  }

  // create state, state getter and state setter
  let state = initialState;

  function getState() {
    return state;
  }

  function setState(newState: TState) {
    localStateRevision++;
    state = newState;
    queueOnChange();
  }

  // define queueOnChange() method to emit the change event after state has been changed
  let timeoutId = 0;
  function queueOnChange() {
    if (timeoutId) return;
    timeoutId = setTimeout(() => {
      onChangeHandler && onChangeHandler(getState(), getRevision());
      timeoutId = 0;
    })
  }

  // allow to subscribe on state changes
  let onChangeHandler: (newState: TState, revision: number) => unknown | null
  function subscribe(cb: (newState: TState, revision: number) => unknown) {
    onChangeHandler = cb;
  }

  const actions = actionCreators(getState, setState);
  return { getState, subscribe, actions, getRevision };
}
type TDispatcher<TState, TActions> = {
  getState: () => TState,
  actions: TActions,
  subscribe: (cb: (newState: TState, revision: number) => unknown) => unknown
  getRevision: () => number;
}


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
  log('Should update component', componentId, triggeredByMsg, '. Diff:', diff);
}

function logMutation(revision: number, prevState: any, newState: any, isGlobal: boolean) {
  const mutationType = isGlobal ? 'GLOBAL' : 'LOCAL';
  const diff = prevState ? getDiff(prevState, newState) : 'unavailable';
  const diffMessage = Object.keys(diff).length ? diff : 'no changes detected with shallow comparison';
  log(`${mutationType} MUTATION #${revision}. Diff:`, diffMessage);
}

function useLogLifecycle(componentId: string) {
  const updateCounterRef = useRef<number>(1);

  // log lifecycle if in the debug mode
  if (DEBUG) {
    if (updateCounterRef.current === 1) {
      log('Create component', componentId);
    } else {
      log('Update component', componentId);
    }
    updateCounterRef.current++;
  }
  useEffect(() => {
    log('Effects applied to component', componentId);
  });
  useEffect(() => {
    return () => log('Destroy component', componentId);
  }, []);
}

let logResetTimeout = 0;
let lastLogTime = 0;
let taskStartTime = 0;
function log(msg: string, ...args: any) {
  if (!DEBUG) return;
  const now = Date.now();
  if (!lastLogTime) taskStartTime = now;
  const ms = lastLogTime ? now - lastLogTime : 0;

  // select console.log color based on elapsed time
  let msColor = 'green';
  if (ms >= 200) {
    msColor = 'red';
  } else if (ms >= 100) {
    msColor = 'orange';
  } else if (ms >= 50) {
    msColor = 'yellow';
  }

  lastLogTime = now;
  console.log('%c%s', `color: ${msColor}`, `+${ms}ms`, `${msg}`, ...args);
  if (!logResetTimeout) logResetTimeout = setTimeout(() => {
    const taskTime = Date.now() - taskStartTime;
    logResetTimeout = 0;
    lastLogTime = 0;
    taskStartTime = 0;
    console.log('%c%s', `color: teal`, `end task for ${taskTime}ms`);
  })
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
  const obj1MergedObjects = getMergedObjects(obj1)
  const obj2MergedObjects = getMergedObjects(obj2)
  const mergedObjects = [...obj1MergedObjects, ...obj2MergedObjects];
  const metadata = {
    _proxyName: 'MergeResult',
    _cache: {},
    _mergedObjects: mergedObjects,
  };

  function getMergedObjects(obj: any) {
    if (obj._proxyName === 'MergeResult') return obj._mergedObjects;
    return [obj];
  }

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
