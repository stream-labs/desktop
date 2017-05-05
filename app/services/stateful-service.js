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
  target[entityType][entityName] = function (localState, payload) {
    let context = {
      moduleName: moduleName,
      get state () {
        return store.state[moduleName];
      },
      set state (newState) {
        Vue.set(store.state, moduleName, newState);
      }
    };
    context.patchState = target.patchState.bind(context);
    return originalMethod.call(context, ...payload.args);
  };
  descriptor.value = function (...args) {
    if (entityType === 'mutations') store.commit(entityName, {args});
  };
  return descriptor;
}

export function stateful (StatefulClass) {
  let mutations = StatefulClass.prototype.mutations;
  if (!StatefulClass.initialState && Object.keys(mutations).length === 0) return;
  store.registerModule(StatefulClass.name, {
    mutations: mutations,
    state: StatefulClass.initialState || {}
  });
}

/**
 * helps to integrate services with Vuex store
 * @abstract
 */
export class StatefulService extends Service {
  static initialState = {};
  store = store;
  moduleName = this.constructor.name;


  get state () {
    return this.store.state[this.moduleName];
  }


  set state (newState) {
    return Vue.set(this.store.state, this.moduleName, newState);
  }


  constructor (...args) {
    super(...args);
    this.init();
  }


  init() {

  }


  patchState(patch) {
    this.state = {...this.state, ...patch};
  }
}