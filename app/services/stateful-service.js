import Service from './service';
import store from '../store';


export function action (target, methodName, descriptor) {
  return registerMethodAsVuexEntity('actions', target, methodName, descriptor)
}


export function mutation (target, methodName, descriptor) {
  return registerMethodAsVuexEntity('mutations', target, methodName, descriptor)
}


function registerMethodAsVuexEntity (entityType, target, methodName, descriptor) {
  let originalMethod = descriptor.value;
  target[entityType] = target[entityType] || {};
  target[entityType][methodName] = function (store, payload) {
    let context = payload[0];
    let args = payload.slice(1);
    payload.shift();
    return originalMethod.call(context, ...args);
  };
  descriptor.value = function (...args) {
    args.unshift(this);
    if (entityType === 'actions') store.dispatch(methodName, args);
    if (entityType === 'mutations') store.commit(methodName, args);
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
  initialState = {};


  get state () {
    return this.store.state[this.moduleName];
  }


  constructor (...args) {
    super(...args);
    store.registerModule(this.moduleName, {
      actions: this.actions,
      mutations: this.mutations,
      state: this.initialState
    });
    this.init();
  }


  init() {

  }
}