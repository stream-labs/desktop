import { combineReducers, createAction, createReducer, createStore, Store } from '@reduxjs/toolkit';
import { batch } from 'react-redux';

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

export function createReducerManager() {
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

      if (action.type === 'initState') {
        state[action.payload.name] = action.payload.initialState;
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

export class StateManager<TInitParams, TController extends IStateController<TInitParams>> {
  static instances: Record<string, StateManager<any, any>> = {};
  private name: string;
  public controller: TController;
  public actionsAndGetters: Record<string, Function> = {};
  public mutationState: unknown;

  constructor(controller: TController, initParams?: TInitParams) {
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

    this.controller = controller as TController;
  }

  incVuexRevision() {
    this.controller['incVuexRevision']();
  }

  forbidRendering() {
    store.dispatch({ type: `${this.name}/forbidRendering` });
  }

  allowRendering() {
    store.dispatch({ type: `${this.name}/allowRendering` });
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

export function mutation() {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    return registerMutation(target, methodName, descriptor.value);
  };
}

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
