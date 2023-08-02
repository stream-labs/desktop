import { State } from 'services/realm';
import { Service } from 'services/core';
import Realm from 'realm';

class TestRealmState extends Realm.Object {
  name: string;

  static schema = {
    name: 'TestRealmState',
    properties: {
      name: { type: 'string', default: 'hello this is default' },
    },
  };
}

export class TestRealmService extends Service {
  @State(TestRealmState as any)
  state: TestRealmState;
}
