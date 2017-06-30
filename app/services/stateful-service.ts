import Vue from 'vue';
import { Store, Module } from 'vuex';
import { Service } from './service';
import store from '../store';

export * from './service';

export function mutation(options = { vuexSyncIgnore: false }) {
  return function (target: any, methodName: string, descriptor: PropertyDescriptor) {
    const serviceName = target.constructor.name;
    const mutationName = `${serviceName}.${methodName}`;

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

    return {
      ...descriptor,

      value(...args: any[]) {
        const constructorArgs = this['constructorArgs'];
        store.commit(
          mutationName, {
            args,
            constructorArgs,
            __vuexSyncIgnore: options.vuexSyncIgnore
          });
      }
    };
  };

}

/**
 * helps to integrate services with Vuex store
 */
export abstract class StatefulService<TState extends object> extends Service {


  get store(): Store<any> {
    return store;
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
    [ModuleContainer.name]: {
      state: ModuleContainer.initialState || {},
      mutations: (<any>ModuleContainer.prototype).mutations
    }
  };
}

/**
 * Classes with Mutator decorator saves constructor's
 * arguments to send them with each called mutation.
 * We need to save constructor arguments to create the same
 * class instance in another window.
 * Caveats:
 * - constructor arguments must be able to be serialized
 * - constructor must not have side effects
 */
export function Mutator(): ClassDecorator {
  return function (target: any) {
    const original = target;

    // create new constructor that will save arguments in instance
    const f:any = function (this: any, ...args: any[]) {
      original.apply(this, args);
      this.constructorArgs = args;
      return this;
    };

    // copy prototype so intanceof operator still works
    f.prototype = original.prototype;

    // vuex modules names related to constructor name
    // so we need to save the name
    Object.defineProperty(f, 'name', { value: target.name });

    // return new constructor (will override original)
    return f;
  };
}
