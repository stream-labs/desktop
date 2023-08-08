import { Service } from 'services';
import Realm from 'realm';
import path from 'path';
import * as remote from '@electron/remote';
import { ExecuteInCurrentWindow } from './core';

/**
 * This class is our extension of the Realm.Object class.
 * The reason it doesn't sublass Realm.Object directly is
 * because Realm does not support inheritance properly.
 * Therefore, we use a workaround involving a wrapper object
 * and dynamically defining properties.
 */
export class RealmObject {
  /**
   * Internal reference to realm model
   */
  private _realmModel: Realm.Object;

  /**
   * Returns a reference to the realm db this object is stored in
   */
  get db() {
    return (RealmService.instance as RealmService).getDb(this);
  }

  /**
   * Public accessor for the underlying Realm model.
   * Implemented as a getter because this class can be created
   * before the database connection is established.
   */
  get realmModel() {
    if (!RealmService.hasInstance) {
      throw new Error('Realm service does not exist!');
    }

    if (!this.db) {
      throw new Error('Realm is not connected!');
    }

    if (!this._realmModel) {
      console.log('GOT DB', this.db);

      // Check the db
      const result = this.db.objects(this.schema.name);

      if (result.length) {
        this._realmModel = result[0];
      } else {
        // TODO: Make this better
        // We might already be in a write transaction
        try {
          this.db.write(() => {
            this._realmModel = this.db.create(this.schema.name, {});
          });
        } catch (e: unknown) {
          this._realmModel = this.db.create(this.schema.name, {});
        }
      }
    }

    return this._realmModel;
  }

  constructor(public schema: Realm.ObjectSchema) {}

  static inject<T = RealmObject>(this: { new (schema: any): T } & typeof RealmObject) {
    if (!RealmService.registeredClasses[this.schema.name]) {
      throw new Error(
        `Tried to inject \`${this.schema.name}\` before it was registered! Did you call \`${this.schema.name}.register()\` immediately after defining the class?`,
      );
    }

    const instance = new this(this.schema);

    // Apply dynamic getters
    Object.keys(this.schema.properties).forEach(key => {
      Object.defineProperty(instance, key, {
        get() {
          return this.realmModel[key];
        },
        set(val: any) {
          this.realmModel[key] = val;
        },
      });
    });

    return instance;
  }

  static register<T extends typeof RealmObject>(this: T, opts: IRealmOptions = {}) {
    if (RealmService.registeredClasses[this.schema.name]) {
      throw new Error(`\`${this.schema.name}\` was registered twice!`);
    }

    // Make sure every object has a unique id
    this.schema.properties['_id'] = { type: 'uuid', default: new Realm.BSON.UUID() };

    const schema = this.schema;

    // This is jumping around some hoops because Realm is extremely picky
    // about the name and base class of its object models.
    const klass = {
      [this.schema.name]: class extends Realm.Object {
        static schema = schema;
      },
    };

    // TypeScript doesn't love metaprogramming
    RealmService.registerObject(
      (klass[this.schema.name] as unknown) as typeof Realm.Object,
      opts.persist,
    );
  }

  /**
   * Inheriting classes should define this in Realm schema format.
   * @see https://www.mongodb.com/docs/realm/sdk/node/model-data/define-a-realm-object-model/
   */
  static schema: Realm.ObjectSchema;
}

interface IRealmOptions {
  persist?: boolean;
}

export class RealmService extends Service {
  persistentDb: Realm;
  ephemeralDb: Realm;

  get ephemeralConfig() {
    const realmPath = path.join(remote.app.getPath('userData'), 'ephemeral.realm');

    return {
      schema: RealmService.ephemeralSchemas,
      path: realmPath,
      inMemory: true,
    };
  }

  get persistentConfig() {
    const realmPath = path.join(remote.app.getPath('userData'), 'persistent.realm');

    return {
      schema: RealmService.persistentSchemas,
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

  static persistentSchemas: typeof Realm.Object[] = [];
  static ephemeralSchemas: typeof Realm.Object[] = [];
  static registeredClasses: Dictionary<'persistent' | 'ephemeral'> = {};

  static registerObject(obj: typeof Realm.Object, persist = false) {
    persist ? this.persistentSchemas.push(obj) : this.ephemeralSchemas.push(obj);
    this.registeredClasses[obj['schema']['name']] = persist ? 'persistent' : 'ephemeral';
  }

  /**
   * Returns the realm db for a given RealmObject
   * @param obj A RealmObject
   */
  @ExecuteInCurrentWindow()
  getDb(obj: RealmObject) {
    if (RealmService.registeredClasses[obj.schema.name] === 'persistent') {
      return this.persistentDb;
    } else {
      return this.ephemeralDb;
    }
  }
}
