import Vue from 'vue';
import { Store, Module } from 'vuex';
import { Service } from './service';
import store from '../store';

export * from './service';

export function mutation(target: any, methodName: string, descriptor: PropertyDescriptor) {
  const serviceName = target.constructor.name;
  const mutationName = `${serviceName}.${methodName}`;

  target.mutations = target.mutations || {};
  target.mutations[mutationName] = function (localState: any, payload: {args: any}) {
    descriptor.value.call(target.constructor.instance, ...payload.args);
  };

  return {
    ...descriptor,

    value(...args: any[]) {
      store.commit(mutationName, { args });
    }
  };
}

/**
 * helps to integrate services with Vuex store
 */
export abstract class StatefulService<TState extends object> extends Service {

  static initialState = {};

  store: Store<any> = store;

  get state(): TState {
    return this.store.state[this.serviceName];
  }


  set state(newState: TState) {
    Vue.set(this.store.state, this.serviceName, newState);
  }

  // Returns an injectable Vuex module
  static getModule(): Module<any, any> {
    return {
      [this.name]: {
        state: this.initialState,
        mutations: (<any>this.prototype).mutations
      }
    };
  }

  patchState(patch: Partial<TState>) {
    // spread operator is not supported on generic types yet
    // https://github.com/Microsoft/TypeScript/issues/12756#issuecomment-265812676
    this.state = { ...(this.state as object), ...(patch as object) } as TState;
  }

}
