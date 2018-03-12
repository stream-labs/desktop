import Vue from 'vue';
import { Store, Module } from 'vuex';
import { Service } from './service';

export * from './service';

export function mutation(options = { vuexSyncIgnore: false }) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    return registerMutation(target, methodName, descriptor, options);
  };

}

function registerMutation(
  target: any,
  methodName: string,
  descriptor: PropertyDescriptor,
  options = { vuexSyncIgnore: false }
) {
  const serviceName = target.constructor.name;
  const mutationName = `${serviceName}.${methodName}`;

  target.originalMethods = target.originalMethods || {};
  target.originalMethods[methodName] = target[methodName];
  target.mutations = target.mutations || {};
  target.mutations[mutationName] = function (localState: any, payload: {args: any, constructorArgs: any}) {
    const targetIsSingleton = !!target.constructor.instance;
    let context = null;

    if (targetIsSingleton) {
      context = target.constructor.instance;
    } else {
      context = new target.constructor(...payload.constructorArgs);
    }

    descriptor.value.call(context, ...payload.args);
  };


  Object.defineProperty(target, methodName, {
    ...descriptor,

    value(...args: any[]) {
      const constructorArgs = this['constructorArgs'];
      const store = StatefulService.getStore();
      store.commit(
        mutationName, {
          args,
          constructorArgs,
          __vuexSyncIgnore: options.vuexSyncIgnore
        });
    }
  });

  return Object.getOwnPropertyDescriptor(target, methodName);
}

/**
 * helps to integrate services with Vuex store
 */
export abstract class StatefulService<TState extends object> extends Service {

  private static store: Store<any>;

  static setupVuexStore(store: Store<any>) {
    this.store = store;
  }

  static getStore() {
    if (!this.store) throw 'vuex store is not set';
    return this.store;
  }

  get store(): Store<any> {
    return StatefulService.store;
  }

  get state(): TState {
    return this.store.state[this.serviceName];
  }


  set state(newState: TState) {
    Vue.set(this.store.state, this.serviceName, newState);
  }


}

/**
 * Returns an injectable Vuex module
 */
export function getModule(ModuleContainer: any): Module<any, any> {
  return {
    state: ModuleContainer.initialState ?
      JSON.parse(JSON.stringify(ModuleContainer.initialState)) : {},
    mutations: (<any>ModuleContainer.prototype).mutations
  };
}

/**
 * Classes with ServiceHelper decorator saves constructor's
 * arguments to send them with each called mutation.
 * We need to save constructor arguments to create the same
 * class instance in another window.
 * Caveats:
 * - constructor arguments must be able to be serialized
 * - constructor must not have side effects
 */
export function ServiceHelper(): ClassDecorator {
  return function (target: any) {
    const original = target;

    // create new constructor that will save arguments in instance
    const f:any = function (this: any, ...args: any[]) {
      original.apply(this, args);
      this.constructorArgs = args;
      this.isHelper = true;
      this.helperName = target.name;
      this._resourceId = this.helperName + JSON.stringify(this.constructorArgs);
      return this;
    };

    // copy prototype so intanceof operator still works
    f.prototype = original.prototype;

    // vuex modules names related to constructor name
    // so we need to save the name
    Object.defineProperty(f, 'name', { value: target.name });

    // inherit mutations
    const baseClassMutations = Object.getPrototypeOf(target.prototype)
      .constructor
      .prototype
      .originalMethods;
    if (baseClassMutations) Object.keys(baseClassMutations).forEach(methodName => {
      if (Object.getOwnPropertyDescriptor(f.prototype, methodName)) return; // mutation is overridden
      f.prototype[methodName] = baseClassMutations[methodName];
      registerMutation(f.prototype, methodName, Object.getOwnPropertyDescriptor(f.prototype, methodName));
    });

    // return new constructor (will override original)
    return f;
  };
}
