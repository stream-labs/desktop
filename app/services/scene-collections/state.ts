import { StatefulService, mutation } from 'services/stateful-service';
import {
  ISceneCollectionsManifestEntry,
  ISceneCollectionSchema,
  ISceneCollectionsServiceApi
} from '.';
import Vue from 'vue';
import fs from 'fs';
import path from 'path';
import electron from 'electron';
import { ISceneCollectionsResponse } from './server-api';

interface ISceneCollectionsManifest {
  activeId: string;
  collections: ISceneCollectionsManifestEntry[];
}

/**
 * This is a submodule of the scene collections service that handles
 * state/manifest mutations and persistence.
 *
 * All methods are public, but this class should be considered prviate
 * to the rest of the app.  It is an internal module in the scene collections
 * service.
 */
export class SceneCollectionsStateService extends StatefulService<
  ISceneCollectionsManifest
> {
  static initialState: ISceneCollectionsManifest = {
    activeId: null,
    collections: []
  };

  get collections() {
    return this.state.collections.filter(coll => !coll.deleted);
  }

  get activeCollection() {
    return this.collections.find(coll => coll.id === this.state.activeId);
  }

  /**
   * Handle a new user login
   * @param serverCollections the collections loaded from the server
   */
  async setupNewUser(serverCollections: ISceneCollectionsResponse) {
    if (serverCollections.data.length > 0) {
      this.LOAD_STATE({
        activeId: null,
        collections: []
      });
      await this.ensureDirectory();
      this.flushManifestFile();
    } else {
      // Do nothing.
      // Local files will be synced up to the server
    }
  }

  /**
   * Loads the manifest file into the state for this service.
   */
  async loadManifestFile() {
    await this.ensureDirectory();

    const exists = await new Promise(resolve => {
      fs.exists(this.manifestFilePath, exists => resolve(exists));
    });

    if (exists) {
      const data = await this.readCollectionFile(this.manifestFilePath);
      if (data) {
        this.LOAD_STATE(JSON.parse(data));
      }
    } else {
      await this.flushManifestFile();
    }
  }

  /**
   * The manifest file is simply a copy of the Vuex state of this
   * service, persisted to disk.
   */
  flushManifestFile() {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(this.state, null, 2);
      fs.writeFile(this.manifestFilePath, data, err => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  /**
   * Reads the contents of the file into a string
   * @param filePath The path to the file
   */
  readCollectionFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data.toString());
      });
    });
  }

  /**
   * Writes data to a collection file
   * @param id The id of the file
   * @param data The data to write
   */
  writeDataToCollectionFile(id: string, data: string) {
    const collectionPath = this.getCollectionFilePath(id);
    return new Promise((resolve, reject) => {
      fs.writeFile(collectionPath, data, err => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  /**
   * Creates the scene collections directory if it doesn't exist
   */
  async ensureDirectory() {
    const exists = await new Promise(resolve => {
      fs.exists(this.collectionsDirectory, exists => resolve(exists));
    });

    if (!exists) {
      await new Promise((resolve, reject) => {
        fs.mkdir(this.collectionsDirectory, err => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      });
    }
  }

  get collectionsDirectory() {
    return path.join(
      electron.remote.app.getPath('userData'),
      'SceneCollections'
    );
  }

  getCollectionFilePath(id: string) {
    return path.join(this.collectionsDirectory, `${id}.json`);
  }

  get manifestFilePath() {
    return path.join(this.collectionsDirectory, 'manifest.json');
  }

  @mutation()
  SET_ACTIVE_COLLECTION(id: string) {
    this.state.activeId = id;
  }

  @mutation()
  ADD_COLLECTION(id: string, name: string, modified: string) {
    this.state.collections.push({
      id,
      name,
      deleted: false,
      modified
    });
  }

  @mutation()
  SET_MODIFIED(id: string, modified: string) {
    this.state.collections.find(coll => coll.id === id).modified = modified;
  }

  @mutation()
  SET_SERVER_ID(id: string, serverId: number) {
    this.state.collections.find(coll => coll.id === id).serverId = serverId;
  }

  @mutation()
  RENAME_COLLECTION(id: string, name: string, modified: string) {
    const coll = this.state.collections.find(coll => coll.id === id);
    coll.name = name;
    coll.modified = modified;
  }

  @mutation()
  DELETE_COLLECTION(id: string) {
    this.state.collections.find(coll => coll.id === id).deleted = true;
  }

  @mutation()
  HARD_DELETE_COLLECTION(id: string) {
    this.state.collections = this.state.collections.filter(
      coll => coll.id !== id
    );
  }

  @mutation()
  LOAD_STATE(state: ISceneCollectionsManifest) {
    Object.keys(state).forEach(key => {
      Vue.set(this.state, key, state[key]);
    });
  }
}
