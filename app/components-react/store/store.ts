import { combineReducers, createSlice, createStore, Store } from '@reduxjs/toolkit';

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

export class StateManager<TControllerClass extends new (...args: any[]) => { state: any }> {
  static instances: Record<string, StateManager<any>> = {};
  private name: string;
  public controller: InstanceType<TControllerClass>;
  public actionsAndGetters: Record<string, Function> = {};

  constructor(
    ControllerClass: TControllerClass,
    initialState: InstanceType<TControllerClass>['state'],
  ) {
    const name = (this.name = ControllerClass.name);
    const controller = new ControllerClass(initialState);
    StateManager.instances[name] = this;

    const slice = createSlice({
      name: this.name,
      initialState: {
        ...controller.state,
        _vuexRevision: 1,
      },
      reducers: {
        ...ControllerClass.prototype['mutations'],
        incVuexRevision(state: any) {
          state['_vuexRevision']++;
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

    prototypes.forEach(proto => {
      Object.getOwnPropertyNames(proto).forEach(propName => {
        if (propName in this.actionsAndGetters) return;
        const descriptor = Object.getOwnPropertyDescriptor(entity, propName);
        if (!descriptor) return;
        if (descriptor.get || typeof descriptor.value === 'function') {
          this.actionsAndGetters[propName] = controller[propName].bind(controller);
        }
      });
    });

    this.controller = controller as InstanceType<TControllerClass>;
  }

  incVuexRevision() {
    store.dispatch({ type: `${this.name}/incVuexRevision` });
  }

  destroy() {
    delete StateManager.instances[this.name];
  }

  getState() {
    const globalState = store.getState() as any;
    return globalState[this.name];
  }
}

export function mutation() {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const className = target.constructor.name;

    target.mutations = target.mutations || {};
    const originalMethod = target[methodName];
    target.mutations[methodName] = (state: unknown, action: { payload: unknown[] }) => {
      originalMethod.apply({ state }, action.payload);
    };

    Object.defineProperty(target, methodName, {
      ...descriptor,

      value(...args: any[]) {
        const action = { type: `${className}/${methodName}`, payload: args };
        store.dispatch(action);
      },
    });

    return Object.getOwnPropertyDescriptor(target, methodName);
  };
}
