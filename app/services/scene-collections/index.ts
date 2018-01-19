import { StatefulService, mutation } from 'services/stateful-service';
import { Inject } from 'util/injector';
import { SceneCollectionsServerApiService } from 'services/scene-collections/server-api';
import Vue from 'vue';
import { RootNode } from './nodes/root';
import { SourcesNode } from './nodes/sources';
import { ScenesNode } from './nodes/scenes';
import { SceneItemsNode } from './nodes/scene-items';
import { TransitionNode } from './nodes/transition';
import { HotkeysNode } from './nodes/hotkeys';
import path from 'path';
import electron from 'electron';
import fs from 'fs';
import { parse } from './parse';
import { ScenesService } from 'services/scenes';
import { SourcesService } from 'services/sources';
import { E_AUDIO_CHANNELS } from 'services/audio';
import { AppService } from 'services/app';
import { HotkeysService } from 'services/hotkeys';
import namingHelpers from '../../util/NamingHelpers';
import { WindowsService } from 'services/windows';
import { UserService } from 'services/user';

const uuid = window['require']('uuid/v4');

interface ISceneCollectionsManifestEntry {
  id: string;
  name: string;
  serverId?: number;
  deleted: boolean;
  modified: string;
}

interface ISceneCollectionsManifest {
  activeId: string;
  collections: ISceneCollectionsManifestEntry[];
}

export const NODE_TYPES = {
  RootNode,
  SourcesNode,
  ScenesNode,
  SceneItemsNode,
  TransitionNode,
  HotkeysNode
};

const DEFAULT_COLLECTION_NAME = 'Scenes';

/**
 * V2 of the scene collections service:
 * - Completely asynchronous
 * - Server side backup
 */
export class SceneCollectionsService extends StatefulService<ISceneCollectionsManifest> {
  @Inject('SceneCollectionsServerApiService') serverApi: SceneCollectionsServerApiService;
  @Inject() scenesService: ScenesService;
  @Inject() sourcesService: SourcesService;
  @Inject() appService: AppService;
  @Inject() hotkeysService: HotkeysService;
  @Inject() windowsService: WindowsService;
  @Inject() userService: UserService;

  static initialState: ISceneCollectionsManifest = {
    activeId: null,
    collections: []
  };

  /**
   * Does not use the standard init function so we can have asynchronous
   * initialization.
   */
  async initialize() {
    await this.loadManifestFile();
    await this.safeSync();
    if (this.activeCollection) {
      await this.load(this.state.activeId);
    } else if (this.collections.length > 0) {
      await this.load(this.collections[0].id);
    } else {
      await this.create();
    }

    window['sapi'] = this.serverApi;
  }

  /**
   * Generally called on application shutdown.
   */
  async deinitialize() {
    this.disableAutoSave();
    await this.save();
    await this.safeSync();
    await this.flushManifestFile();
  }

  /**
   * Saves the current scene collection
   */
  async save(): Promise<void> {
    await this.saveCurrentApplicationStateAs(this.state.activeId);
    this.SET_MODIFIED(this.state.activeId, (new Date()).toISOString());
  }

  /**
   * This is a safe method that will load the requested scene collection.
   * It is responsible for cleaning up and saving any existing config,
   * setting the app in the apropriate loading state, and updating the state
   * and server.
   * @param id The id of the colleciton to load
   * @param shouldAttemptRecovery whether a new copy of the file should
   * be downloaded from the server if loading fails.
   */
  async load(id: string, shouldAttemptRecovery = true): Promise<void> {
    this.startLoadingOperation();
    this.deloadCurrentApplicationState();

    try {
      await this.loadCollectionIntoApplicationState(id);
      await this.setActiveCollection(id);
    } catch (e) {
      if (shouldAttemptRecovery) {
        await this.attemptRecovery(id);
      } else {
        console.warn(`Unsuccessful recovery of scene collection ${id} attempted`);
        await this.create();
      }
    }

    this.finishLoadingOperation();
  }

  /**
   * Creates and switches to a new blank scene collection
   */
  async create(name?: string) {
    this.startLoadingOperation();
    this.deloadCurrentApplicationState();
    this.setupEmptyCollection();

    name = name || this.suggestName(DEFAULT_COLLECTION_NAME);
    const id: string = uuid();

    await this.insertCollection(id, name);
    await this.setActiveCollection(id);
    this.finishLoadingOperation();
  }

  /**
   * Deletes the current scene collection
   */
  async delete() {
    this.startLoadingOperation();
    this.deloadCurrentApplicationState();
    await this.removeCollection(this.state.activeId);

    if (this.collections.length > 0) {
      this.load(this.collections[0].id);
    } else {
      this.create();
    }
  }

  /**
   * Renames the current scene collection
   * @param name the name of the new scene collection
   */
  rename(name: string) {
    this.RENAME_COLLECTION(this.state.activeId, name, (new Date()).toISOString());
  }

  /**
   * Duplicates the current scene collection
   * @param name the name of the new scene collection
   */
  async duplicate(name: string) {
    await this.save();
    const id = uuid();
    await this.insertCollection(id, name);
    await this.setActiveCollection(id);
  }

  /**
   * Based on the provided name, suggest a new name that does
   * not conflict with any current name.
   *
   * Name conflicts are actually ok in this system, but can
   * be a little confusing for the user, so we soft-enforce
   * it in the UI layer.
   * @param name the base name
   */
  suggestName(name: string) {
    return namingHelpers.suggestName(name, (name: string) => {
      return !!this.collections.find(collection => {
        return collection.name === name;
      });
    });
  }

  /**
   * Show the window to name a new scene collection
   * @param options options
   */
  showNameConfig(
    options: { sceneCollectionToDuplicate?: string; rename?: boolean } = {}
  ) {
    this.windowsService.showWindow({
      componentName: 'NameSceneCollection',
      queryParams: {
        sceneCollectionToDuplicate: options.sceneCollectionToDuplicate,
        rename: options.rename ? 'true' : ''
      },
      size: {
        width: 400,
        height: 250
      }
    });
  }

  get collections() {
    return this.state.collections.filter(coll => !coll.deleted);
  }

  get activeCollection() {
    return this.collections.find(coll => coll.id === this.state.activeId);
  }

  /* PRIVATE ----------------------------------------------------- */

  /**
   * Loads the scenes/sources/etc associated with a scene collection
   * into the current application state.
   * @param id The id of the collection to load
   */
  private async loadCollectionIntoApplicationState(id: string): Promise<void> {
    const filePath = path.join(this.collectionsDirectory, `${id}.json`);
    const data = await this.readCollectionFile(filePath);
    if (data == null) throw new Error('Got blank data from collection file');

    const root = parse(data, NODE_TYPES);
    await root.load();

    // Make sure we actually loaded something that works
    if (this.scenesService.scenes.length === 0) this.setupEmptyCollection();
  }

  /**
   * Writes the current application state to a file with the given id
   * @param id the id to save under
   */
  private async saveCurrentApplicationStateAs(id: string) {
    const root = new RootNode();
    await root.save();
    const data = JSON.stringify(root, null, 2);

    await this.writeDataToCollectionFile(id, data);
  }

  /**
   * Attempts to recover and load a copy of this scene
   * collection from the server.
   * @param id The id of the collection to recover
   */
  private async attemptRecovery(id: string) {
    // Check if the server has a copy
    const collection = this.collections.find(coll => coll.id === id);

    if (collection.serverId) {
      // A local hard delete without notifying the server
      // will force a fresh download from the server on next sync
      this.HARD_DELETE_COLLECTION(id);
      await this.safeSync();

      // Find the newly downloaded collection and load it
      const newCollection = this.collections.find(coll => coll.serverId === collection.serverId);

      if (newCollection) {
        await this.load(newCollection.id, false);
        return;
      }
    }

    // Fall back to creating a new collection
    await this.create();
  }

  /**
   * Writes data to a collection file
   * @param id The id of the file
   * @param data The data to write
   */
  private writeDataToCollectionFile(id: string, data: string) {
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
   * This deloads all scenes and sources and gets the application
   * ready to load a new config file.  This should only ever be
   * performed while the application is already in a "LOADING" state.
   */
  private deloadCurrentApplicationState() {
    this.disableAutoSave();

    // we should remove inactive scenes first to avoid the switching between scenes
    this.scenesService.scenes.forEach(scene => {
      if (scene.id === this.scenesService.activeSceneId) return;
      scene.remove(true);
    });

    if (this.scenesService.activeScene) {
      this.scenesService.activeScene.remove(true);
    }

    this.sourcesService.sources.forEach(source => {
      if (source.type !== 'scene') source.remove();
    });

    this.hotkeysService.unregisterAll();
  }

  /**
   * Should be called before any loading operations
   */
  private startLoadingOperation() {
    this.appService.startLoading();
    this.disableAutoSave();
  }

  /**
   * Should be called after any laoding operations
   */
  private finishLoadingOperation() {
    this.appService.finishLoading();
    this.enableAutoSave();
  }

  /**
   * Creates the scenes and sources that come in by default
   * in an empty scene collection.
   */
  private setupEmptyCollection() {
    this.scenesService.createScene('Scene', { makeActive: true });
    this.setupDefaultAudio();
  }

  /**
   * Creates the default audio sources
   */
  private setupDefaultAudio() {
    this.sourcesService.createSource(
      'DesktopAudioDevice1',
      'wasapi_output_capture',
      {},
      { channel: E_AUDIO_CHANNELS.OUTPUT_1 }
    );

    this.sourcesService.createSource(
      'AuxAudioDevice1',
      'wasapi_input_capture',
      {},
      { channel: E_AUDIO_CHANNELS.INPUT_1 }
    );
  }

  /**
   * Creates and persists new collection from the current application state
   */
  private async insertCollection(id: string, name: string) {
    await this.saveCurrentApplicationStateAs(id);
    this.ADD_COLLECTION(id, name, (new Date()).toISOString());
  }

  /**
   * Deletes on the server and removes from the store
   */
  private async removeCollection(id: string) {
    this.DELETE_COLLECTION(id);

    // TODO: Delete the file (for safety and recoverability we soft delete for now)
  }

  /**
   * Creates the scene collections directory if it doesn't exist
   */
  private async ensureDirectory() {
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

  /**
   * Reads the contents of the file into a string
   * @param filePath The path to the file
   */
  private readCollectionFile(filePath: string): Promise<string> {
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
   * Gets the modified time of a collection file
   * @param id the id of the collection
   */
  private getCollectionModified(id: string): Promise<Date> {
    return new Promise((resolve, reject) => {
      const filePath = this.getCollectionFilePath(id);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(stats.mtime);
      });
    });
  }

  /**
   * The manifest file is simply a copy of the Vuex state of this
   * service, persisted to disk.
   */
  private flushManifestFile() {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(this.state, null, 2);
      fs.writeFile(this.getCollectionFilePath('manifest'), data, err => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  private autoSaveInterval: number;

  private enableAutoSave() {
    this.autoSaveInterval = window.setInterval(() => {
      this.save();
    }, 60 * 1000);
  }

  private disableAutoSave() {
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
  }

  private async setActiveCollection(id: string) {
    // TODO: Notify the server
    this.SET_ACTIVE_COLLECTION(id);
  }

  /**
   * Loads the manifest file into the state for this service.
   */
  private async loadManifestFile() {
    await this.ensureDirectory();
    const manifestPath = this.getCollectionFilePath('manifest');

    const exists = await new Promise(resolve => {
      fs.exists(manifestPath, exists => resolve(exists));
    });

    if (exists) {
      const data = await this.readCollectionFile(manifestPath);
      if (data) {
        this.LOAD_STATE(JSON.parse(data));
      }
    } else {
      await this.flushManifestFile();
    }
  }

  private get collectionsDirectory() {
    return path.join(electron.remote.app.getPath('userData'), 'SceneCollections');
  }

  private getCollectionFilePath(id: string) {
    return path.join(this.collectionsDirectory, `${id}.json`);
  }

  /**
   * Synchronizes with the server based on the current state
   * of the manifest.  It can either be used in a "fire and forget"
   * manner, or you can wait on the promise.  If you wait on the
   * promise, it will ensure that files are fully synchronized as
   * of the time of the original function invocation.
   * This function is idempotent.
   * This function is a no-op if the user is logged out.
   *
   * This function essentially performs 6 tasks all in parallel:
   * - Delete collections on the server that were deleted locally
   * - Delete collections locally that were deleted on the server
   * - Create collections on the server that were created locally
   * - Create collections locally that were created on the server
   * - Upload collections that have newer versions locally
   * - Download collections that have newer version on the server
   */
  private async sync() {
    if (!this.userService.isLoggedIn()) return;

    const serverCollections = (await this.serverApi.fetchSceneCollections()).data;
    const promises: Promise<any>[] = [];

    serverCollections.forEach(onServer => {
      const inManifest = this.state.collections.find(coll => coll.serverId === onServer.id);

      // console.log('------------');
      // console.log('Collection ID: ', inManifest.id);
      // console.log('Local Date: ', inManifest.modified);
      // console.log('Local Date: ', new Date(inManifest.modified));
      // console.log('Server Date: ', onServer.last_updated_at);
      // console.log('Server Date: ', new Date(onServer.last_updated_at));

      if (!inManifest) {
        // Insert from server
        const id: string = uuid();
        promises.push(this.serverApi.fetchSceneCollection(onServer.id).then(response => {
          return this.writeDataToCollectionFile(id, response.scene_collection.data).then(() => {
            // Only do this after we know we successfully wrote the file
            this.ADD_COLLECTION(id, onServer.name, (new Date()).toISOString());
            this.SET_SERVER_ID(id, onServer.id);
          });
        }));
      } else {
        if (inManifest.deleted) {
          // We need to tell the server this was deleted
          promises.push(this.serverApi.deleteSceneCollection(inManifest.serverId).then(() => {
            // We can hard delete once we know it has been removed from the server
            this.HARD_DELETE_COLLECTION(inManifest.id);
          }));
        } else if (new Date(inManifest.modified) > new Date(onServer.last_updated_at)) {
          promises.push(this.readCollectionFile(this.getCollectionFilePath(inManifest.id)).then(data => {
            return this.serverApi.updateSceneCollection({
              id: inManifest.serverId,
              name: inManifest.name,
              data,
              last_updated_at: inManifest.modified
            });
          }));
        } else if (new Date(inManifest.modified) < new Date(onServer.last_updated_at)) {
          promises.push(this.serverApi.fetchSceneCollection(onServer.id).then(response => {
            return this.writeDataToCollectionFile(inManifest.id, response.scene_collection.data).then(() => {
              // Only do this once we know we have written successfully
              this.RENAME_COLLECTION(inManifest.id, onServer.name, onServer.last_updated_at);
            });
          }));
        } else {
          console.log('Up to date file: ', inManifest.id);
        }

      }
    });

    this.state.collections.forEach(inManifest => {
      const onServer = serverCollections.find(coll => coll.id === inManifest.serverId);

      // We already dealt with the overlap above
      if (!onServer) {
        if (!inManifest.serverId) {
          promises.push(this.readCollectionFile(this.getCollectionFilePath(inManifest.id)).then(data => {
            return this.serverApi.createSceneCollection({
              name: inManifest.name,
              data,
              last_updated_at: inManifest.modified
            }).then(response => {
              this.SET_SERVER_ID(inManifest.id, response.id);
            });
          }));
        } else {
          this.HARD_DELETE_COLLECTION(inManifest.id);
        }
      }
    });

    await Promise.all(promises);
    await this.flushManifestFile();
  }

  /**
   * Calls sync, but will never cause a rejected promise.
   * Instead, it will log an error and continue.
   */
  private async safeSync() {
    try {
      await this.sync();
    } catch (e) {
      console.error('Scene collection sync failed: ', e);
    }
  }

  @mutation()
  private SET_ACTIVE_COLLECTION(id: string) {
    this.state.activeId = id;
  }

  @mutation()
  private ADD_COLLECTION(id: string, name: string, modified: string) {
    this.state.collections.push({
      id,
      name,
      deleted: false,
      modified
    });
  }

  @mutation()
  private SET_MODIFIED(id: string, modified: string) {
    this.state.collections.find(coll => coll.id === id).modified = modified;
  }

  @mutation()
  private SET_SERVER_ID(id: string, serverId: number) {
    this.state.collections.find(coll => coll.id === id).serverId = serverId;
  }

  @mutation()
  private RENAME_COLLECTION(id: string, name: string, modified: string) {
    const coll = this.state.collections.find(coll => coll.id === id);
    coll.name = name;
    coll.modified = modified;
  }

  @mutation()
  private DELETE_COLLECTION(id: string) {
    this.state.collections.find(coll => coll.id === id).deleted = true;
  }

  @mutation()
  private HARD_DELETE_COLLECTION(id: string) {
    this.state.collections = this.state.collections.filter(coll => coll.id !== id);
  }

  @mutation()
  private LOAD_STATE(state: ISceneCollectionsManifest) {
    Object.keys(state).forEach(key => {
      Vue.set(this.state, key, state[key]);
    });
  }

}
