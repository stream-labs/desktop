import { RealmObject } from 'services/realm';
import { Service } from 'services/core';

class SomePersistentState extends RealmObject {
  first: string;
  last: string;

  static schema = {
    name: 'SomePersistentState', // Name in DB, must be unique
    properties: {
      // Defaults if there isn't an entry in the DB
      first: { type: 'string', default: 'Taylor' },
      last: { type: 'string', default: 'Swift' },
    },
  };

  // Example of a computed property (can potentially replace Views)
  get fullName() {
    return `${this.first} ${this.last}`;
  }
}

// All schemas need to be registered before we connect to the DB
SomePersistentState.register({ persist: true });

class SomeEphemeralState extends RealmObject {
  title: string;

  static schema = {
    name: 'SomeEphemeralState',
    properties: {
      title: { type: 'string', default: '' },
    },
  };
}

SomeEphemeralState.register();

export class TestRealmService extends Service {
  // Can inject into any property anywhere - nothing magic about `state` anymore
  state1 = SomePersistentState.inject();
  state2 = SomeEphemeralState.inject();

  someBadAction() {
    // ERROR! Tried to update state outside of transaction
    this.state1.first = 'Taytay';
  }

  someGoodAction() {
    // No more mutations
    // Changes are reactive, available everywhere, and atomic
    // Writes can happen from any process
    this.state2.db.write(() => {
      // This is an ACID transaction
      this.state2.title = 'Midnights';
    });
  }
}
