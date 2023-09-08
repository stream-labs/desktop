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
   * Serializable id string as hex
   */
  get idString() {
    return this.realmModel['_id'].toHexString();
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
      let result = this.db.objects(this.schema.name);

      // Filter by id if present
      if (this._initWithId) {
        result = result.filtered('_id == $0', this._initWithId);
      }

      if (result.length) {
        this._realmModel = result[0];
      } else {
        if (this._initWithId) {
          throw new Error(`Object with id does not exist: ${this._initWithId}`);
        }

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

  private _initWithId: Realm.BSON.UUID;

  constructor(public schema: Realm.ObjectSchema, id?: Realm.BSON.UUID) {
    this._initWithId = id;

    // Apply dynamic getters
    Object.keys(this.schema.properties).forEach(key => {
      Object.defineProperty(this, key, {
        get() {
          return this.realmModel[key];
        },
        set(val: any) {
          this.realmModel[key] = val;
        },
      });
    });
  }

  static inject<T = RealmObject>(this: { new (schema: any): T } & typeof RealmObject) {
    if (!RealmService.databaseMappings[this.schema.name]) {
      throw new Error(
        `Tried to inject \`${this.schema.name}\` before it was registered! Did you call \`${this.schema.name}.register()\` immediately after defining the class?`,
      );
    }

    return new this(this.schema);
  }

  static register<T extends typeof RealmObject>(this: T, opts: IRealmOptions = {}) {
    if (RealmService.databaseMappings[this.schema.name]) {
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
      this,
      opts.persist,
    );
  }

  static fromId(id: string) {
    const uuid = Realm.BSON.UUID.createFromHexString(id);
    return new this(this.schema, uuid);
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
  static databaseMappings: Dictionary<'persistent' | 'ephemeral'> = {};
  static registeredClasses: Dictionary<typeof RealmObject> = {};

  static registerObject(obj: typeof Realm.Object, klass: typeof RealmObject, persist = false) {
    persist ? this.persistentSchemas.push(obj) : this.ephemeralSchemas.push(obj);
    this.databaseMappings[obj['schema']['name']] = persist ? 'persistent' : 'ephemeral';
    this.registeredClasses[obj['schema']['name']] = klass;
  }

  /**
   * Returns the realm db for a given RealmObject
   * @param obj A RealmObject
   */
  @ExecuteInCurrentWindow()
  getDb(obj: RealmObject) {
    if (RealmService.databaseMappings[obj.schema.name] === 'persistent') {
      return this.persistentDb;
    } else {
      return this.ephemeralDb;
    }
  }
}
