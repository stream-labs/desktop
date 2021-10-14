import { configureStore, createSlice, PayloadAction, Store } from '@reduxjs/toolkit';
import { batch, useSelector as useReduxSelector } from 'react-redux';
import { StatefulService } from '../../services';
import { useOnCreate } from '../hooks';
import { useEffect, useRef } from 'react';
import { isSimilar } from '../../util/isDeepEqual';
import { createBinding, TBindings } from '../shared/inputs';
import { getDefined } from '../../util/properties-type-guards';
import { unstable_batchedUpdates } from 'react-dom';
import Utils from '../../services/utils';

/*
 * This file provides Redux integration in a modular way
 */

// INITIALIZE REDUX STORE

export const modulesSlice = createSlice({
  name: 'modules',
  initialState: {},
  reducers: {
    initModule: (state, action) => {
      const { moduleName, initialState } = action.payload;
      state[moduleName] = initialState;
    },
    destroyModule: (state, action: PayloadAction<string>) => {
      const moduleName = action.payload;
      delete state[moduleName];
    },
    mutateModule: (state, action) => {
      const { moduleName, methodName, args } = action.payload;
      const moduleManager = getModuleManager();
      const module = getModuleManager().getModule(moduleName);
      moduleManager.setImmerState(state);
      module[methodName](...args);
      moduleManager.setImmerState(null);
    },
  },
});

export const store = configureStore({
  reducer: {
    modules: modulesSlice.reducer,
  },
});

const actions = modulesSlice.actions;

/**
 * ReduxModuleManager helps to organize code splitting with help of Redux Modules
 * Each Redux Module controls its own chunk of state in the global Redux store
 * Redux Modules are objects that contain initialState, actions, mutations and getters
 *
 * Use Redux Modules when you need share some logic or state between several React components
 *
 * StatefulServices could be used as an alternative to Redux Modules
 * However, there are some significant differences between Redux Modules and StatefulServices:
 * - StatefulServices are singleton objects. Redux Modules could have multiple instances
 * - StatefulServices always exist after initialization. Redux Modules exist only while components that are using them are mounted
 * - StatefulServices exist in the Worker window only and are reachable from other windows by IPC only. Redux Modules could exist in any window .
 *
 * Redux Modules are perfect for situations where:
 *  - You want to share some logic or state between several React components that are intended to work together
 *  - You want to simplify a complex React component so it should be responsible only for rendering, and you extract everything unrelated to rendering to a module
 *  - You have performance issues in your React component related to a redundant re-renderings or multiple IPC calls to Services
 *
 * StatefulServices and Services are perfect for situations where:
 *  - You want to have some global reactive state across multiple windows
 *  - You need a place for `http` data fetching, like API calls. So you can monitor all your http requests in the same dev-tools window
 *  - You need some polling/watching code that should work across the entire app
 *  - You need to expose some API for external usage and generate jsdoc documentation
 *
 *  With further migration to Redux we probably want StatefulServices to be a slightly modified version
 *  of ReduxModules because they use similar concepts
 */
class ReduxModuleManager {
  public immerState: any;
  registeredModules: Record<string, IReduxModuleMetadata> = {};

  /**
   * Register a new Redux Module and initialize it
   * @param module the module object
   * @param initParams params that will be passed in the `.init()` handler after module initialization
   */
  registerModule<TInitParams, TModule extends IReduxModule<any, any>>(
    module: TModule,
    initParams?: TInitParams,
    moduleName = '',
  ): TModule {
    // use constructor name as a module name if other name not provided
    moduleName = moduleName || module.constructor.name;

    // call `init()` method of module if exist
    unstable_batchedUpdates(() => {
      module.name = moduleName;
      // create a record in `registeredModules` with the newly created module
      this.registeredModules[moduleName] = {
        componentIds: [],
        module,
        watchers: [],
      };

      module.init && module.init(initParams as TInitParams);
      const initialState = module.state;

      // replace module methods with mutation calls
      replaceMethodsWithMutations(module);

      // Re-define the `state` variable of the module
      // It should be linked to the global Redux sate after module initialization
      // But when mutation is running it should be linked to a special Proxy from the Immer library
      Object.defineProperty(module, 'state', {
        get: () => {
          if (this.immerState) return this.immerState[moduleName];
          const globalState = store.getState() as any;
          return globalState.modules[moduleName];
        },
        set: (newState: unknown) => {
          const isMutationRunning = !!this.immerState;
          if (!isMutationRunning) throw new Error('Can not change the state outside of mutation');
          this.immerState[moduleName] = newState;
        },
      });

      // call the `initModule` mutation to initialize the module's initial state
      store.dispatch(modulesSlice.actions.initModule({ moduleName, initialState }));
    });

    return module;
  }

  /**
   * Unregister the module and erase its state from Redux
   */
  unregisterModule(moduleName: string) {
    const module = this.getModule(moduleName);
    module.destroy && module.destroy();
    store.dispatch(actions.destroyModule(moduleName));
    delete this.registeredModules[moduleName];
  }

  /**
   * Get the Module by name
   */
  getModule<TModule extends IReduxModule<any, any>>(moduleName: string): TModule {
    return this.registeredModules[moduleName]?.module as TModule;
  }

  /**
   * Register a component that is using the module
   */
  registerComponent(moduleName: string, componentId: string) {
    this.registeredModules[moduleName].componentIds.push(componentId);
  }

  /**
   * Un-register a component that is using the module.
   * If the module doesnt have registered components it will be destroyed
   */
  unRegisterComponent(moduleName: string, componentId: string) {
    const moduleMetadata = this.registeredModules[moduleName];
    moduleMetadata.componentIds = moduleMetadata.componentIds.filter(id => id !== componentId);
    if (!moduleMetadata.componentIds.length) this.unregisterModule(moduleName);
  }

  /**
   * When Redux is running mutation it replaces the state object with a special Proxy object from
   * the Immer library. Keep this object in the `immerState` property
   */
  setImmerState(immerState: unknown) {
    this.immerState = immerState;
  }

  /**
   * Run watcher functions registered in modules
   */
  runWatchers() {
    Object.keys(this.registeredModules).map(moduleName => {
      const watchers = this.registeredModules[moduleName].watchers;
      watchers.forEach(watcher => {
        const newVal = watcher.selector();
        const prevVal = watcher.prevValue;
        watcher.prevValue = newVal;
        if (newVal !== prevVal) {
          watcher.onChange(newVal, prevVal);
        }
      });
    });
  }
}

let moduleManager: ReduxModuleManager;

/**
 * The ModuleManager is a singleton object accessible in other files via the `getModuleManager()` call
 */
export function getModuleManager() {
  if (!moduleManager) {
    // create the ModuleManager and
    // automatically register some additional modules
    moduleManager = new ReduxModuleManager();

    // add a BatchedUpdatesModule for rendering optimizations
    moduleManager.registerModule(new BatchedUpdatesModule());

    // add a VuexModule for Vuex support
    moduleManager.registerModule(new VuexModule());

    // save module manager in the global namespace for debugging
    if (Utils.isDevMode()) window['mm'] = moduleManager;
  }
  return moduleManager;
}

/**
 * This module introduces a simple implementation of batching updates for the performance optimization
 * It prevents components from being re-rendered in a not-ready state
 * and reduces an overall amount of redundant re-renderings
 *
 * React 18 introduced automated batched updates.
 * So most likely we can remove this module after the migration to the new version of React
 * https://github.com/reactwg/react-18/discussions/21
 */
class BatchedUpdatesModule {
  state = {
    isRenderingDisabled: false,
  };

  /**
   * Temporary disables rendering for components when multiple mutations are being applied
   */
  temporaryDisableRendering() {
    // if rendering is already disabled just ignore
    if (this.state.isRenderingDisabled) return;

    // disable rendering
    this.setIsRenderingDisabled(true);

    // enable rendering again when Javascript processes the current queue of tasks
    setTimeout(() => {
      this.setIsRenderingDisabled(false);
      moduleManager.runWatchers();
    });
  }

  @mutation()
  private setIsRenderingDisabled(disabled: boolean) {
    this.state.isRenderingDisabled = disabled;
  }
}

/**
 * This module adds reactivity support from Vuex
 * It ensures that React components are be re-rendered when Vuex updates their dependencies
 *
 * We should remove this module after we fully migrate our components to Redux
 */
class VuexModule {
  /**
   * Keep revisions for each StatefulService module in this state
   */
  state: Record<string, number> = {};

  init() {
    // watch for mutations from the global Vuex store
    // and increment the revision number for affected StatefulService
    StatefulService.store.subscribe(mutation => {
      const serviceName = mutation.type.split('.')[0];
      this.incrementRevision(serviceName);
    });
  }

  @mutation()
  incrementRevision(statefulServiceName: string) {
    if (!this.state[statefulServiceName]) {
      this.state[statefulServiceName] = 1;
    } else {
      this.state[statefulServiceName]++;
    }
  }
}

/**
 * A decorator that registers the object method as an mutation
 */
export function mutation() {
  return function (target: any, methodName: string) {
    target.mutations = target.mutations || [];
    // mark the method as an mutation
    target.mutations.push(methodName);
  };
}

function replaceMethodsWithMutations(module: IReduxModule<unknown, unknown>) {
  const moduleName = getDefined(module.name);
  const mutationNames: string[] = Object.getPrototypeOf(module).mutations || [];

  mutationNames.forEach(mutationName => {
    const originalMethod = module[mutationName];

    // override the original Module method to dispatch mutations
    module[mutationName] = function (...args: any[]) {
      // if this method was called from another mutation
      // we don't need to dispatch a new mutation again
      // just call the original method
      const mutationIsRunning = !!moduleManager.immerState;
      if (mutationIsRunning) return originalMethod.apply(module, args);

      const batchedUpdatesModule = moduleManager.getModule<BatchedUpdatesModule>(
        'BatchedUpdatesModule',
      );

      // clear unserializable events from arguments
      args = args.map(arg => {
        const isReactEvent = arg._reactName;
        if (isReactEvent) return { _reactName: arg._reactName };
        return arg;
      });

      // dispatch reducer and call `temporaryDisableRendering()`
      // so next mutation in the javascript queue will not cause redundant re-renderings in components
      batch(() => {
        if (moduleName !== 'BatchedUpdatesModule') batchedUpdatesModule.temporaryDisableRendering();
        store.dispatch(actions.mutateModule({ moduleName, methodName: mutationName, args }));
      });
    };
  });
}

/**
 * This `useSelector` is a wrapper for the original `useSelector` method from Redux
 * - Optimizes component re-rendering via batched updates from Redux and Vuex
 * - Uses isDeepEqual with depth 2 as a default comparison function
 */
export function useSelector<T extends Object>(fn: () => T): T {
  const moduleManager = getModuleManager();
  const batchedUpdatesModule = moduleManager.getModule<BatchedUpdatesModule>(
    'BatchedUpdatesModule',
  );
  const cachedSelectedResult = useRef<any>(null);
  const isMountedRef = useRef(false);

  // save the selector function and update it each component re-rendering
  // this prevents having staled closure variables in the selector
  const selectorFnRef = useRef(fn);
  selectorFnRef.current = fn;

  // create the selector function
  const selector = useOnCreate(() => {
    return () => {
      // if `isRenderingDisabled=true` selector will return previously cached values
      if (batchedUpdatesModule.state.isRenderingDisabled && isMountedRef.current) {
        return cachedSelectedResult.current;
      }

      // otherwise execute the selector
      cachedSelectedResult.current = selectorFnRef.current();
      return cachedSelectedResult.current;
    };
  });

  useEffect(() => {
    isMountedRef.current = true;
  });

  return useReduxSelector(selector, (prevState, newState) => {
    // there is no reason to compare prevState and newState if
    // the rendering is disabled for components
    if (batchedUpdatesModule.state.isRenderingDisabled) {
      return true;
    }

    // use `isSimilar` function to compare 2 states
    if (!isSimilar(prevState, newState)) {
      return false;
    }
    return true;
  }) as T;
}

/**
 * Wraps the given object in a Proxy for watching read operations on this object
 *
 * @example
 *
 * const myObject = { foo: 1, bar: 2, qux: 3};
 * const { watcherProxy, getDependentFields } = createDependencyWatcher(myObject);
 * const { foo, bar } = watcherProxy;
 * getDependentFields(); // returns ['foo', 'bar'];
 *
 */
export function createDependencyWatcher<T extends object>(watchedObject: T) {
  const dependencies: Record<string, any> = {};
  const watcherProxy = new Proxy(
    {
      _proxyName: 'DependencyWatcher',
      _watchedObject: watchedObject,
      _dependencies: dependencies,
    },
    {
      get: (target, propName: string) => {
        // if (propName === 'hasOwnProperty') return watchedObject.hasOwnProperty;
        if (propName in target) return target[propName];
        const value = watchedObject[propName];
        dependencies[propName] = value;
        return value;
        // }
      },
    },
  ) as T;

  function getDependentFields() {
    return Object.keys(dependencies);
  }

  function getDependentValues(): Partial<T> {
    const values: Partial<T> = {};
    Object.keys(dependencies).forEach(propName => {
      const value = dependencies[propName];
      // if one of the dependencies is a Binding then expose its internal dependencies
      if (value && value._proxyName === 'Binding') {
        const bindingMetadata = value._binding;
        Object.keys(bindingMetadata.dependencies).forEach(bindingPropName => {
          values[`${bindingPropName}__binding-${bindingMetadata.id}`] =
            dependencies[propName][bindingPropName].value;
        });
        return;
      }
      // if it's not a Binding then just take the value from the watchedObject
      values[propName] = watchedObject[propName];
    });
    return values;
  }

  return { watcherProxy, getDependentFields, getDependentValues };
}

/**
 * Watch changes on a reactive state in the module
 */
export function watch<T>(
  module: IReduxModule<any, any>,
  selector: () => T,
  onChange: (newVal: T, prevVal: T) => unknown,
) {
  const moduleName = getDefined(module.name);
  const moduleMetadata = moduleManager.registeredModules[moduleName];
  moduleMetadata.watchers.push({
    selector,
    onChange,
    prevValue: selector(),
  });
}

interface IWatcher<T> {
  selector: () => T;
  onChange: (newVal: T, prevVal: T) => unknown;
  prevValue: T;
}

/**
 * Returns a reactive binding for inputs
 *
 * @example 1 usage with getter and setter
 *
 * const bind = useBinding({
 *   get theme() {
 *     return this.customizationService.state.theme
 *   },
 *   set theme(val: string) {
 *     this.customizationService.actions.setSettings({ theme: val });
 *   }
 * })
 *
 * return <ListInput {...bind.theme} />
 *
 *
 * @example 2 usage with a setter function
 *
 * const bind = useBinding(
 *   () => this.customizationService.state,
 *   newState => this.customizationService.setSettings(newState)
 * )
 *
 * return <ListInput {...bind.theme} />
 *
 */
export function useBinding<TState extends object, TExtraProps extends object = {}>(
  stateGetter: TState | (() => TState),
  stateSetter?: (newTarget: Partial<TState>) => unknown,
  extraPropsGenerator?: (fieldName: keyof TState) => TExtraProps,
): TBindings<TState, TExtraProps> {
  const bindingRef = useRef<TBindings<TState, TExtraProps>>();

  if (!bindingRef.current) {
    // create binding
    bindingRef.current = createBinding(stateGetter, stateSetter, extraPropsGenerator);
  }

  // make dependencies reactive
  useSelector(() => {
    const binding = getDefined(bindingRef.current);
    const dependentFields = Object.keys(binding._binding.dependencies);
    const result = {};
    dependentFields.forEach(fieldName => {
      result[fieldName] = binding[fieldName];
    });
    return result;
  });

  return bindingRef.current;
}

export interface IReduxModule<TInitParams, TState> {
  state: TState;
  name?: string;
  init?: (initParams: TInitParams) => unknown;
  destroy?: () => unknown;
}

interface IReduxModuleMetadata {
  componentIds: string[];
  module: IReduxModule<any, any>;
  watchers: IWatcher<unknown>[];
}
