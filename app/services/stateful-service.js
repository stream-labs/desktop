import Service from './service';
import store from '../store';
import Vue from 'vue';


export function mutation (target, methodName, descriptor) {
  return registerMethodAsVuexEntity('mutations', target, methodName, descriptor)
}


function registerMethodAsVuexEntity (entityType, target, methodName, descriptor) {
  let moduleName = target.constructor.name;
  let entityName = moduleName + '.' + methodName;
  let originalMethod = descriptor.value;
  target[entityType] = target[entityType] || {};
  target[entityType][entityName] = function (store, payload) {
    let context = payload.context;
    delete payload.context;
    context = context || Service.instancesContainer[moduleName];
    return originalMethod.call(context, ...payload.args);
  };
  descriptor.value = function (...args) {
    if (entityType === 'mutations') store.commit(entityName, {context: this, args});
  };
  return descriptor;
}


/**
 * helps to integrate services with Vuex store
 * @abstract
 */
export class StatefulService extends Service {
  store = store;
  moduleName = this.constructor.name;

  get initialState() {
    return {};
  }


  get state () {
    return this.store.state[this.moduleName];
  }


  set state (newState) {
    return Vue.set(this.store.state, this.moduleName, newState);
  }


  constructor (...args) {
    super(...args);
    store.registerModule(this.moduleName, {
      mutations: this.mutations,
      state: this.initialState
    });
    this.init();
  }


  init() {

  }


  patchState(patch) {
    this.state = {...this.state, ...patch};
  }
}