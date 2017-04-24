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
    let args = payload.splice(1);
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
 *
 * @abstract
 */
export class StatefulService extends Service {
  store = store;
  state = {};

  constructor(...args) {
    super(...args);
    store.registerModule(this.constructor.name, {
      actions: this.actions,
      mutations: this.mutations,
      state: this.state
    });
  }
}