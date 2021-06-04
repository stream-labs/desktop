import { combineReducers, createSlice, createStore, Store } from '@reduxjs/toolkit';
import { batch } from 'react-redux';
import Utils from '../../services/utils';
import {merge} from "../hooks/useStateManager";

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
        _renderingDisabled: false,
      },
      reducers: {
        ...ControllerClass.prototype['mutations'],
        incVuexRevision(state: any) {
          state['_vuexRevision']++;
        },
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

    this.controller = controller as InstanceType<TControllerClass>;
  }

  async incVuexRevision() {
    if (this.isRenderingDisabled) return;

    batch(() => {
      store.dispatch({ type: `${this.name}/forbidRendering` });
      store.dispatch({ type: `${this.name}/incVuexRevision` });
    });

    await Utils.sleep(0);
    if (this.isRenderingDisabled) store.dispatch({ type: `${this.name}/allowRendering` });
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
    const globalState = store.getState() as any;
    return globalState[this.name];
  }
}

export function mutation() {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const className = target.constructor.name;

    target.mutations = target.mutations || {};
    target.originalMethods = target.originalMethods || {};
    target.originalMethods[methodName] = target[methodName];
    const originalMethod = target[methodName];

    // function createStateContext(state: unknown) {
    //   return new Proxy(
    //     { _proxyName: 'StateContext' },
    //     {
    //       get(t, propName) {
    //         if (propName === 'state') return state;
    //         if (target.originalMethods[propName]) return target.originalMethods[propName];
    //         return controller[propName];
    //       },
    //     },
    //   );
    // }

    function createMutationContext(state: unknown) {
      const controller = StateManager.instances[className].controller;

      return new Proxy(
        { _proxyName: 'MutationContext', controller, state },
        {
          get(t, propName) {
            if (propName === 'state') return state;
            if (target.originalMethods[propName]) return target.originalMethods[propName];
            return controller[propName];
          },
        },
      );
    }

    target.mutations[methodName] = (state: unknown, action: { payload: unknown[] }) => {
      console.log('call mutation', methodName);
      const context = createMutationContext(state);
      originalMethod.apply(context, action.payload);
    };

    Object.defineProperty(target, methodName, {
      ...descriptor,

      value(...args: any[]) {
        console.log('dispatch action', methodName);
        batch(() => {
          store.dispatch({ type: `${className}/forbidRendering` });
          store.dispatch({ type: `${className}/${methodName}`, payload: args });
          store.dispatch({ type: `${className}/allowRendering` });
        });
      },
    });

    return Object.getOwnPropertyDescriptor(target, methodName);
  };
}
