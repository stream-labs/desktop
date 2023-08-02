import { Service } from 'services';
import Realm from 'realm';
import path from 'path';
import * as remote from '@electron/remote';
import { ExecuteInCurrentWindow } from './core';

export class TestObject extends Realm.Object<TestObject> {
  name: string;

  static schema = {
    name: 'TestObject',
    properties: {
      _id: 'int',
      name: 'string',
    },
  };
}

export function State(type: typeof Realm.Object): PropertyDecorator {
  return function (target: unknown, property: string) {
    let state: Realm.Object;

    console.log('REALM REGISTER', type.name);
    RealmService.registerObject(type);

    Object.defineProperty(target, property, {
      get: () => {
        if (!RealmService.hasInstance) {
          throw new Error('Realm service does not exist!');
        }

        const realm = RealmService.instance as RealmService;

        if (!realm.persistentDb) {
          throw new Error('Realm is not connected!');
        }

        if (!state) {
          // Check the db
          const result = realm.persistentDb.objects(type['schema'].name);

          if (result.length) {
            state = result[0];
          } else {
            console.log('CREATING NEW OBJECT IN DB');
            realm.persistentDb.write(() => {
              realm.persistentDb.create(type['schema'].name, {});
            });
          }
        }

        return state;
      },
    });
  };
}

interface IStateOptions {
  persist: boolean;
}

export class RealmService extends Service {
  persistentDb: Realm;
  ephemeralDb: Realm;

  get ephemeralConfig() {
    const realmPath = path.join(remote.app.getPath('userData'), 'ephemeral.realm');

    return {
      schema: RealmService.objects,
      path: realmPath,
      inMemory: true,
    };
  }

  get persistentConfig() {
    const realmPath = path.join(remote.app.getPath('userData'), 'persistent.realm');

    return {
      schema: RealmService.objects,
      path: realmPath,
    };
  }

  // Every process needs its own realm connections
  @ExecuteInCurrentWindow()
  async connect() {
    console.log('REALM SERVICE INIT');

    this.persistentDb = await Realm.open(this.persistentConfig as any);
    this.ephemeralDb = await Realm.open(this.ephemeralConfig as any);

    console.log('REALM INITED');
  }

  static objects: typeof Realm.Object[] = [];

  static registerObject(obj: typeof Realm.Object) {
    this.objects.push(obj);
  }
}
