import { merge } from 'lodash';
import { StatefulService } from './stateful-service';
import Utils from './utils';

// Extends StatefulService with code that will persist the
// state across executions of the application.

export abstract class PersistentStatefulService<TState extends object> extends StatefulService<
  TState
> {
  // This is the default state if the state is not found
  // in local storage.
  static defaultState = {};

  static get initialState() {
    const persisted = JSON.parse(localStorage.getItem(this.localStorageKey)) || {};

    return merge({}, this.defaultState, persisted);
  }

  static get localStorageKey() {
    return `PersistentStatefulService-${this.name}`;
  }

  init() {
    this.store.watch(
      () => {
        return JSON.stringify(this.state);
      },
      val => {
        // save only non-default values to the localStorage
        const PersistentService = this.constructor as typeof PersistentStatefulService;
        const valueToSave = Utils.getDeepChangedParams(
          PersistentService.defaultState,
          JSON.parse(val),
        );
        localStorage.setItem(PersistentService.localStorageKey, JSON.stringify(valueToSave));
      },
    );
  }
}
