import { combineReducers, createSlice, createStore, Store } from '@reduxjs/toolkit';
import { batch } from 'react-redux';

const appSlice = createSlice({
  name: 'app',
  initialState: {},
  reducers: {},
});

// Define the Reducers that will always be present in the application
const staticReducers = {
  app: appSlice.reducer,
};

type TStore = Store & {
  injectReducer: (key: string, asyncReducer: any) => unknown;
  asyncReducers: Record<string, any>;
};

// Configure the store
export default function configureStore(initialState: Object): TStore {
  const store = createStore(createReducer(), initialState) as TStore;

  // Add a dictionary to keep track of the registered async reducers
  store.asyncReducers = {};

  // Create an inject reducer function
  // This function adds the async reducer, and creates a new combined reducer
  store.injectReducer = (key, asyncReducer) => {
    store.asyncReducers[key] = asyncReducer;
    store.replaceReducer(createReducer(store.asyncReducers));
  };

  // Return the modified store
  return store;
}

function createReducer(asyncReducers?: Object) {
  let newReducers = {
    ...staticReducers,
  };
  if (asyncReducers) {
    newReducers = { ...newReducers, ...asyncReducers };
  }
  return combineReducers(newReducers);
}

export const store = configureStore({});

export interface IStateController<TInitParams> {
  state: any;
  init?: (initParams: TInitParams) => unknown;
}

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

    const slice = createSlice({
      name: this.name,
      initialState: {
        ...controller.state,
        _vuexRevision: 1,
        _renderingDisabled: false,
      },
      reducers: {
        ...controllerProto['mutations'],
        forbidRendering(state: any) {
          state['_isRenderingDisabled'] = true;
        },
        allowRendering(state: any) {
          state['_isRenderingDisabled'] = false;
        },
      },
    });

    Object.defineProperty(controller, 'state', {
      get: () => this.getState(),
    });

    store.injectReducer(slice.name, slice.reducer);

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
