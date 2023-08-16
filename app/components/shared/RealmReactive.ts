import { RealmObject } from 'services/realm';
import Vue from 'vue';

export function realmReactive<T extends RealmObject>(obj: T) {
  function listener(this: Vue) {
    this.$forceUpdate();
  };

  return {
    created: () => {
      console.log('VUE MIXIN CREATE');
      obj.realmModel.addListener(listener);
    },
    destroyed: () => {
      obj.realmModel.removeListener(listener);
      console.log('VUE MIXIN DESTROY');
    },
  };
}
