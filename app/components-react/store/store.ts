import { combineReducers, createAction, createReducer, createStore, Store } from '@reduxjs/toolkit';
import { batch, shallowEqual, useSelector as useReduxSelector } from 'react-redux';
import { StatefulService } from '../../services';
import isPlainObject from 'lodash/isPlainObject';

/**
 * Creates reducer manager that allows using dynamic reducers
 * Code example from https://redux.js.org/recipes/code-splitting#using-a-reducer-manager
 */
function createReducerManager() {
  // Create an object which maps keys to reducers
  const reducers = {
    global: createReducer({}, {}),
  };

  // Create the initial combinedReducer
  // let combinedReducer = combineReducers(reducers);
  let combinedReducer = combineReducers(reducers);

  // An array which is used to delete state keys when reducers are removed
  let keysToRemove: string[] = [];

  return {
    getReducerMap: () => reducers,

    // The root reducer function exposed by this object
    // This will be passed to the store
    reduce: (state: any, action: any) => {
      // If any reducers have been removed, clean up their state first
      if (keysToRemove.length > 0) {
        state = { ...state };
        for (const key of keysToRemove) {
          delete state[key];
        }
        keysToRemove = [];
      }

      // Delegate to the combined reducer
      return combinedReducer(state, action);
    },

    // Adds a new reducer with the specified key
    add: (key: string, reducer: any) => {
      if (!key || reducers[key]) {
        return;
      }

      // Add the reducer to the reducer mapping
      reducers[key] = reducer;

      // Generate a new combined reducer
      combinedReducer = combineReducers(reducers);
    },

    // Removes a reducer with the specified key
    remove: (key: string) => {
      if (!key || !reducers[key]) {
        return;
      }

      // Remove it from the reducer mapping
      delete reducers[key];

      // Add the key to the list of keys to clean up
      keysToRemove.push(key);

      // Generate a new combined reducer
      combinedReducer = combineReducers(reducers);
    },
  };
}

function configureStore() {
  const reducerManager = createReducerManager();

  // Create a store with the root reducer function being the one exposed by the manager.
  const store = createStore(reducerManager.reduce, {}) as TStore;

  // Optional: Put the reducer manager on the store so it is easily accessible
  store.reducerManager = reducerManager;
  return store;
}

export const store = configureStore();

/**
 * StateManager allows to access parts of store via StateController
 * StateController are objects that contain initialState, actions, mutations and getters
 */
export class StateManager<TInitParams, TStateController extends IStateController<TInitParams>> {
  static instances: Record<string, StateManager<any, any>> = {};
  private name: string;
  public controller: TStateController;
  public actionsAndGetters: Record<string, Function> = {};
  public mutationState: unknown;

  constructor(controller: TStateController, initParams?: TInitParams) {
    const name = (this.name = controller.constructor.name);
    controller.init && controller.init(initParams as TInitParams);
    const controllerProto = Object.getPrototypeOf(controller);

    registerMutation(controllerProto, 'incVuexRevision', () => {
      this.getState()['_vuexRevision']++;
    });

    StateManager.instances[name] = this;

    const initialState = {
      ...controller.state,
      _vuexRevision: 1,
      _isRenderingDisabled: false,
    };

    const mutations = {
      ...controllerProto['mutations'],
      forbidRendering(state: any) {
        state['_isRenderingDisabled'] = true;
      },
      allowRendering(state: any) {
        state['_isRenderingDisabled'] = false;
      },
    };

    const reducer = createReducer(initialState, builder => {
      Object.keys(mutations).forEach(mutationName => {
        const action = createAction(`${name}/${mutationName}`);
        builder.addCase(action, mutations[mutationName]);
      });
    });

    Object.defineProperty(controller, 'state', {
      get: () => this.getState(),
    });

    store.reducerManager.add(name, reducer);
    store.dispatch({ type: 'initState', payload: { name, initialState } });

    let entity = controller;
    const prototypes = [];
    while (entity.constructor.name !== 'Object') {
      prototypes.push(entity);
      entity = Object.getPrototypeOf(entity);
    }

    try {
      prototypes.forEach(proto => {
        Object.getOwnPropertyNames(proto).forEach(propName => {
          if (propName in this.actionsAndGetters) return;
          const descriptor = Object.getOwnPropertyDescriptor(proto, propName);
          if (!descriptor) return;
          if (descriptor.get) {
            Object.defineProperty(this.actionsAndGetters, propName, {
              get: () => {
                return controller[propName];
              },
            });
          } else if (typeof controller[propName] === 'function') {
            this.actionsAndGetters[propName] = controller[propName].bind(controller);
          }
        });
      });
    } catch (e) {
      console.log('constructor error', e);
    }

    this.controller = controller as TStateController;
  }

  incVuexRevision() {
    this.controller['incVuexRevision']();
  }

  get isRenderingDisabled() {
    return this.getState()['_isRenderingDisabled'];
  }

  destroy() {
    store.reducerManager.remove(this.name);
    delete StateManager.instances[this.name];
  }

  getState() {
    if (this.mutationState) return this.mutationState;
    const globalState = store.getState() as any;
    return globalState[this.name];
  }

  setMutationState(mutationState: unknown) {
    this.mutationState = mutationState;
  }

  temporaryDisableRendering() {
    if (this.isRenderingDisabled) return;

    console.log('DISABLE rendering');
    store.dispatch({ type: `${this.name}/forbidRendering` });

    setTimeout(() => {
      console.log('ENABLE rendering');
      store.dispatch({ type: `${this.name}/allowRendering` });
    });
  }
}

/**
 * A decorator that register the object method as an mutation
 */
export function mutation() {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    return registerMutation(target, methodName, descriptor.value);
  };
}

/**
 * Register function as an mutation
 */
function registerMutation(target: any, mutationName: string, fn: Function) {
  const className = target.constructor.name;

  target.mutations = target.mutations || {};
  target.originalMethods = target.originalMethods || {};
  target.originalMethods[mutationName] = fn;
  const originalMethod = fn;

  target.mutations[mutationName] = (state: unknown, action: { payload: unknown[] }) => {
    console.log('call mutation', mutationName);
    const stateManager = StateManager.instances[className];
    const controller = stateManager.controller;
    stateManager.setMutationState(state);
    originalMethod.apply(controller, action.payload);
    stateManager.setMutationState(null);
  };

  Object.defineProperty(target, mutationName, {
    configurable: true,
    value(...args: any[]) {
      console.log('dispatch action', mutationName);

      const stateManager = StateManager.instances[className];
      const controller = stateManager.controller;
      const mutationIsRunning = !!stateManager.mutationState;
      if (mutationIsRunning) return originalMethod.apply(controller, args);

      batch(() => {
        stateManager.temporaryDisableRendering();
        store.dispatch({ type: `${className}/${mutationName}`, payload: args });
      });
    },
  });

  return Object.getOwnPropertyDescriptor(target, mutationName);
}

export interface IStateController<TInitParams> {
  state: any;
  init?: (initParams: TInitParams) => unknown;
}

type TStore = Store & {
  reducerManager: {
    add: (key: string, reducer: any) => unknown;
    remove: (key: string) => unknown;
  };
};

class Vuex {
  state: Record<string, number> = {};

  init() {
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

const vuexController = new StateManager(Vuex).controller;

export function useSelector<T extends Object>(fn: () => T, comparisonFn?: () => boolean): T {
  let componentProps: T = null;

  useReduxSelector(
    () => {
      const affectedVuexServices = StatefulService.watchReadOperations(() => {
        componentProps = fn();
      });

      const vuexRevisions = {};
      affectedVuexServices.forEach(serviceName => {
        vuexRevisions[serviceName] = vuexController.state[serviceName];
      });

      return { componentProps, vuexRevisions };
    },
    (prevState, newState) => {
      if (comparisonFn && comparisonFn() === true) {
        return true;
      }

      if (!shallowEqual(prevState.vuexRevisions, newState.vuexRevisions)) {
        return false;
      }
      if (!isSimilar(prevState.componentProps, newState.componentProps)) {
        return false;
      }
      return true;
    },
  );

  return componentProps;
}

/**
 * consider isSimilar as isDeepEqual with depth 2
 */
function isSimilar(obj1: any, obj2: any) {
  return isDeepEqual(obj1, obj2, 0, 2);
}

/**
 * Compare 2 object with limited depth
 */
function isDeepEqual(obj1: any, obj2: any, currentDepth: number, maxDepth: number): boolean {
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

/**
 * Shallow compare 2 arrays
 */
function isArrayEqual(a: any[], b: any[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
