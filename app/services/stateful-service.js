import Vue from 'vue';
import { Service } from './service';
import store from '../store';

export function mutation(target, methodName, descriptor) {
  const serviceName = target.constructor.name;
  const mutationName = `${serviceName}.${methodName}`;

  target.mutations = target.mutations || {};
  target.mutations[mutationName] = function (localState, payload) {
    descriptor.value.call(target.constructor.instance, ...payload.args);
  };

  return {
    ...descriptor,

    value(...args) {
      store.commit(mutationName, { args });
    }
  };
}

/**
 * helps to integrate services with Vuex store
 * @abstract
 */
export class StatefulService extends Service {

  static initialState = {};

  store = store;

  get state() {
    return this.store.state[this.serviceName];
  }


  set state(newState) {
    return Vue.set(this.store.state, this.serviceName, newState);
  }


  // Returns an injectable Vuex module
  static getModule() {
    return {
      [this.name]: {
        state: this.initialState,
        mutations: this.prototype.mutations
      }
    };
  }

  patchState(patch) {
    this.state = { ...this.state, ...patch };
  }
}
