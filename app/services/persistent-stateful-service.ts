import { StatefulService } from './stateful-service';

// Extends StatefulService with code that will persist the
// state across executions of the application.

export abstract class PersistentStatefulService<TState extends object> extends StatefulService<TState> {


  init() {
    const persisted = JSON.parse(localStorage.getItem(this.serviceName)) as Partial<TState> || {};

    this.store.commit('LOAD_PERSISTED_STATE', {
      serviceName: this.serviceName,
      state: {
        ...(this.state as object),
        ...(persisted as object)
      }
    });

    this.store.watch(
      () => {
        return JSON.stringify(this.state);
      },
      val => {
        localStorage.setItem(this.serviceName, val);
      }
    );
  }

}
