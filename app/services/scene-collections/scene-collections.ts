import { Service } from 'services/service';
import { Inject } from 'util/injector';
import { SceneCollectionsServerApiService } from 'services/scene-collections/server-api';
import Vue from 'vue';
import { RootNode } from './nodes/root';
import { SourcesNode, ISourceInfo } from './nodes/sources';
import { ScenesNode, ISceneSchema } from './nodes/scenes';
import { SceneItemsNode, ISceneItemInfo } from './nodes/scene-items';
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
import { OverlaysPersistenceService, IDownloadProgress } from './overlays';
import {
  ISceneCollectionsManifestEntry,
  ISceneCollectionSchema,
  ISceneCollectionsServiceApi,
  ISceneCollectionCreateOptions
} from '.';
import { SceneCollectionsStateService } from './state';
import { Subject } from 'rxjs/Subject';

const uuid = window['require']('uuid/v4');

export const NODE_TYPES = {
  RootNode,
  SourcesNode,
  ScenesNode,
  SceneItemsNode,
  TransitionNode,
  HotkeysNode
};

const DEFAULT_COLLECTION_NAME = 'Scenes';

interface ISceneCollectionsManifest {
  activeId: string;
  collections: ISceneCollectionsManifestEntry[];
}

/**
 * V2 of the scene collections service:
 * - Completely asynchronous
 * - Server side backup
 */
export class SceneCollectionsService extends Service
  implements ISceneCollectionsServiceApi {
  @Inject('SceneCollectionsServerApiService')
  serverApi: SceneCollectionsServerApiService;
  @Inject('SceneCollectionsStateService')
  stateService: SceneCollectionsStateService;
  @Inject() scenesService: ScenesService;
  @Inject() sourcesService: SourcesService;
  @Inject() appService: AppService;
  @Inject() hotkeysService: HotkeysService;
  @Inject() windowsService: WindowsService;
  @Inject() userService: UserService;
  @Inject() overlaysPersistenceService: OverlaysPersistenceService;

  collectionAdded = new Subject<ISceneCollectionsManifestEntry>();
  collectionRemoved = new Subject<ISceneCollectionsManifestEntry>();
  collectionSwitched = new Subject<ISceneCollectionsManifestEntry>();
  collectionWillSwitch = new Subject<void>();
  collectionUpdated = new Subject<ISceneCollectionsManifestEntry>();

  /**
   * Whether the service has been initialized
   */
  private initialized = false;

  /**
   * Does not use the standard init function so we can have asynchronous
   * initialization.
   */
  async initialize() {
    await this.migrate();
    await this.stateService.loadManifestFile();
    await this.safeSync();
    if (this.activeCollection) {
      await this.load(this.activeCollection.id);
    } else if (this.collections.length > 0) {
      await this.load(this.collections[0].id);
    } else {
      await this.create();
    }
    this.initialized = true;
  }

  /**
   * Should be called when a new user logs in.  If the user has
   * scene collections backed up on the server, it will reset
   * the manifest and load from the server.
   */
  async setupNewUser() {
    const serverCollections = await this.serverApi.fetchSceneCollections();
    await this.stateService.setupNewUser(serverCollections);
    await this.initialize();
  }

  /**
   * Generally called on application shutdown.
   */
  async deinitialize() {
    this.disableAutoSave();
    await this.deloadCurrentApplicationState();
    await this.safeSync();
    await this.stateService.flushManifestFile();
  }

  /**
   * Saves the current scene collection
   */
  async save(): Promise<void> {
    if (!this.activeCollection) return;
    await this.saveCurrentApplicationStateAs(this.activeCollection.id);
    this.stateService.SET_MODIFIED(
      this.activeCollection.id,
      new Date().toISOString()
    );
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
    await this.deloadCurrentApplicationState();

    try {
      await this.loadCollectionIntoApplicationState(id);
      await this.setActiveCollection(id);
    } catch (e) {
      if (shouldAttemptRecovery) {
        await this.attemptRecovery(id);
      } else {
        console.warn(
          `Unsuccessful recovery of scene collection ${id} attempted`
        );
        alert('Failed to load scene collection.  A new one will be created instead.');
        await this.create();
      }
    }

    this.finishLoadingOperation();
  }

  /**
   * Creates and switches to a new blank scene collection
   * @param name the name of the collection
   * @param setupFunction a function that can be used to set
   * up some state.  This should really only be used by the OBS
   * importer.
   */
  async create(options: ISceneCollectionCreateOptions = {}): Promise<void> {
    this.startLoadingOperation();
    await this.deloadCurrentApplicationState();

    if (options.setupFunction && options.setupFunction()) {
      // Do nothing
    } else {
      this.setupEmptyCollection();
    }

    const name = options.name || this.suggestName(DEFAULT_COLLECTION_NAME);
    const id: string = uuid();

    await this.insertCollection(id, name);
    await this.setActiveCollection(id);
    if (options.needsRename) this.stateService.SET_NEEDS_RENAME(id);
    this.finishLoadingOperation();
  }

  /**
   * Deletes a scene collection.  If no id is specified, it
   * will delete the current collection.
   * @param id the id of the collection to delete
   */
  async delete(id?: string): Promise<void> {
    id = id || this.activeCollection.id;

    const removingActiveCollection = id === this.activeCollection.id;

    this.removeCollection(id);

    if (removingActiveCollection) {
      this.startLoadingOperation();
      await this.deloadCurrentApplicationState();

      if (this.collections.length > 0) {
        this.load(this.collections[0].id);
      } else {
        this.create();
      }
    }
  }

  /**
   * Renames a scene collection.
   * @param name the name of the new scene collection
   * @param id if not present, will operate on the current collection
   */
  rename(name: string, id?: string) {
    this.stateService.RENAME_COLLECTION(
      id || this.activeCollection.id,
      name,
      new Date().toISOString()
    );
    this.collectionUpdated.next(this.getCollection(id));
  }

  /**
   * Calls sync, but will never cause a rejected promise.
   * Instead, it will log an error and continue.
   */
  async safeSync() {
    try {
      await this.sync();
    } catch (e) {
      console.error('Scene collection sync failed: ', e);
    }
  }

  /**
   * Duplicates a scene collection.
   * @param name the name of the new scene collection
   */
  async duplicate(name: string, id?: string) {
    this.disableAutoSave();

    id = id || this.activeCollection.id;
    const newId = uuid();
    await this.stateService.copyCollectionFile(id, newId);
    await this.insertCollection(newId, name);
    this.stateService.SET_NEEDS_RENAME(newId);
    this.enableAutoSave();
  }

  /**
   * Install a new overlay from a URL
   * @param url the URL of the overlay file
   * @param name the name of the overlay
   * @param progressCallback a callback that receives progress of the download
   */
  async installOverlay(
    url: string,
    name: string,
    progressCallback?: (info: IDownloadProgress) => void
  ) {
    this.startLoadingOperation();

    const pathName = await this.overlaysPersistenceService.downloadOverlay(
      url,
      progressCallback
    );
    const collectionName = this.suggestName(name);
    await this.loadOverlay(pathName, collectionName);
  }

  /**
   * Install a new overlay from a file path
   * @param filePath the location of the overlay file
   * @param name the name of the overlay
   */
  async loadOverlay(filePath: string, name: string) {
    this.startLoadingOperation();
    await this.deloadCurrentApplicationState();
    await this.overlaysPersistenceService.loadOverlay(filePath);
    this.setupDefaultAudio();

    const id: string = uuid();
    await this.insertCollection(id, name);
    await this.setActiveCollection(id);
    this.finishLoadingOperation();
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

  /**
   * Show the window to manage scene collections
   */
  showManageWindow() {
    this.windowsService.showWindow({
      componentName: 'ManageSceneCollections',
      size: {
        width: 700,
        height: 800
      }
    });
  }

  /**
   * Returns the collection with the specified id
   * @param id the id of the collection
   */
  getCollection(id: string) {
    return this.collections.find(coll => coll.id === id);
  }

  /**
   * Used by StreamDeck
   */
  fetchSceneCollectionsSchema(): Promise<ISceneCollectionSchema[]> {
    const promises: Promise<ISceneCollectionSchema>[] = [];

    this.collections.forEach(collection => {
      promises.push(
        new Promise<ISceneCollectionSchema>(resolve => {
          const file = this.stateService.getCollectionFilePath(collection.id);
          this.stateService.readCollectionFile(file).then(data => {
            const root = parse(data, NODE_TYPES);
            const collectionSchema: ISceneCollectionSchema = {
              id: collection.id,
              name: collection.name,

              scenes: root.data.scenes.data.items.map(
                (sceneData: ISceneSchema) => {
                  return {
                    id: sceneData.id,
                    name: sceneData.name,
                    sceneItems: sceneData.sceneItems.data.items.map(
                      (sceneItemData: ISceneItemInfo) => {
                        return {
                          sceneItemId: sceneItemData.id,
                          sourceId: sceneItemData.sourceId
                        };
                      }
                    )
                  };
                }
              ),

              sources: root.data.sources.data.items.map(
                (sourceData: ISourceInfo) => {
                  return {
                    id: sourceData.id,
                    name: sourceData.name,
                    type: sourceData.type,
                    channel: sourceData.channel
                  };
                }
              )
            };

            resolve(collectionSchema);
          });
        })
      );
    });

    return Promise.all(promises);
  }

  get collections() {
    return this.stateService.collections;
  }

  get activeCollection() {
    return this.stateService.activeCollection;
  }

  /* PRIVATE ----------------------------------------------------- */

  /**
   * Loads the scenes/sources/etc associated with a scene collection
   * into the current application state.
   * @param id The id of the collection to load
   */
  private async loadCollectionIntoApplicationState(id: string): Promise<void> {
    const filePath = this.stateService.getCollectionFilePath(id);
    const data = await this.stateService.readCollectionFile(filePath);
    if (data == null) throw new Error('Got blank data from collection file');

    const root = parse(data, NODE_TYPES);
    await root.load();

    this.hotkeysService.bindHotkeys();

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

    await this.stateService.writeDataToCollectionFile(id, data);
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
      this.stateService.HARD_DELETE_COLLECTION(id);
      await this.safeSync();

      // Find the newly downloaded collection and load it
      const newCollection = this.collections.find(
        coll => coll.serverId === collection.serverId
      );

      if (newCollection) {
        await this.load(newCollection.id, false);
        return;
      }
    }

    // Fall back to creating a new collection
    await this.create();
  }

  /**
   * This deloads all scenes and sources and gets the application
   * ready to load a new config file.  This should only ever be
   * performed while the application is already in a "LOADING" state.
   */
  private async deloadCurrentApplicationState() {
    if (!this.initialized) return;

    this.collectionWillSwitch.next();

    this.disableAutoSave();
    await this.save();

    // we should remove inactive scenes first to avoid the switching between scenes
    try {
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
    } catch (e) {
      console.error('Error deloading application state');
    }

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
    this.stateService.ADD_COLLECTION(id, name, new Date().toISOString());
    this.collectionAdded.next(this.collections.find(coll => coll.id === id));
  }

  /**
   * Deletes on the server and removes from the store
   */
  private removeCollection(id: string) {
    this.collectionRemoved.next(this.collections.find(coll => coll.id === id));
    this.stateService.DELETE_COLLECTION(id);

    // Currently we don't remove files on disk in case we need to recover them
    // manually at a later point in time.  Once we are more comfortable with
    // the system, we can start actually deleting files from disk.
  }

  private autoSaveInterval: number;

  private enableAutoSave() {
    this.autoSaveInterval = window.setInterval(() => {
      this.save();
      this.stateService.flushManifestFile();
    }, 60 * 1000);
  }

  private disableAutoSave() {
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
  }

  private async setActiveCollection(id: string) {
    const collection = this.collections.find(coll => coll.id === id);

    if (collection) {
      if (collection.serverId)
        await this.serverApi.makeSceneCollectionActive(collection.serverId);
      this.stateService.SET_ACTIVE_COLLECTION(id);
      this.collectionSwitched.next(collection);
    }
  }

  private get legacyDirectory() {
    return path.join(electron.remote.app.getPath('userData'), 'SceneConfigs');
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

    const serverCollections = (await this.serverApi.fetchSceneCollections())
      .data;
    const promises: Promise<any>[] = [];

    serverCollections.forEach(onServer => {
      const inManifest = this.stateService.state.collections.find(
        coll => coll.serverId === onServer.id
      );

      if (!inManifest) {
        // Insert from server
        const id: string = uuid();
        promises.push(
          this.serverApi.fetchSceneCollection(onServer.id).then(response => {
            return this.stateService
              .writeDataToCollectionFile(id, response.scene_collection.data)
              .then(() => {
                // Only do this after we know we successfully wrote the file
                this.stateService.ADD_COLLECTION(
                  id,
                  onServer.name,
                  new Date().toISOString()
                );
                this.stateService.SET_SERVER_ID(id, onServer.id);
              });
          })
        );
      } else {
        if (inManifest.deleted) {
          // We need to tell the server this was deleted
          promises.push(
            this.serverApi
              .deleteSceneCollection(inManifest.serverId)
              .then(() => {
                // We can hard delete once we know it has been removed from the server
                this.stateService.HARD_DELETE_COLLECTION(inManifest.id);
              })
          );
        } else if (
          new Date(inManifest.modified) > new Date(onServer.last_updated_at)
        ) {
          promises.push(
            this.stateService
              .readCollectionFile(
                this.stateService.getCollectionFilePath(inManifest.id)
              )
              .then(data => {
                return this.serverApi.updateSceneCollection({
                  id: inManifest.serverId,
                  name: inManifest.name,
                  data,
                  last_updated_at: inManifest.modified
                });
              })
          );
        } else if (
          new Date(inManifest.modified) < new Date(onServer.last_updated_at)
        ) {
          promises.push(
            this.serverApi.fetchSceneCollection(onServer.id).then(response => {
              return this.stateService
                .writeDataToCollectionFile(
                  inManifest.id,
                  response.scene_collection.data
                )
                .then(() => {
                  // Only do this once we know we have written successfully
                  this.stateService.RENAME_COLLECTION(
                    inManifest.id,
                    onServer.name,
                    onServer.last_updated_at
                  );
                });
            })
          );
        } else {
          console.log('Up to date file: ', inManifest.id);
        }
      }
    });

    this.stateService.state.collections.forEach(inManifest => {
      const onServer = serverCollections.find(
        coll => coll.id === inManifest.serverId
      );

      // We already dealt with the overlap above
      if (!onServer) {
        if (!inManifest.serverId) {
          promises.push(
            this.stateService
              .readCollectionFile(
                this.stateService.getCollectionFilePath(inManifest.id)
              )
              .then(data => {
                return this.serverApi
                  .createSceneCollection({
                    name: inManifest.name,
                    data,
                    last_updated_at: inManifest.modified
                  })
                  .then(response => {
                    this.stateService.SET_SERVER_ID(inManifest.id, response.id);
                  });
              })
          );
        } else {
          this.stateService.HARD_DELETE_COLLECTION(inManifest.id);
        }
      }
    });

    await Promise.all(promises);
    await this.stateService.flushManifestFile();
  }

  /**
   * Migrates to V2 scene collections if needed.
   */
  private async migrate() {
    const legacyExists = await new Promise<boolean>(resolve => {
      fs.exists(this.legacyDirectory, exists => resolve(exists));
    });

    const newExists = await new Promise<boolean>(resolve => {
      fs.exists(this.stateService.collectionsDirectory, exists =>
        resolve(exists)
      );
    });

    if (legacyExists && !newExists) {
      const files = await new Promise<string[]>((resolve, reject) => {
        fs.readdir(this.legacyDirectory, (err, files) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(files);
        });
      });

      const filtered = files.filter(file => {
        if (file.match(/\.bak$/)) return false;
        const name = file.replace(/\.[^/.]+$/, '');
        if (!name) return false;
        return true;
      });

      for (const file of filtered) {
        const oldData = await new Promise<string>((resolve, reject) => {
          fs.readFile(path.join(this.legacyDirectory, file), (err, data) => {
            if (err) {
              console.error(`Failed migrating file ${file}`);
              resolve('');
            }

            resolve(data.toString());
          });
        });

        if (oldData) {
          await this.stateService.ensureDirectory();
          const id: string = uuid();
          await this.stateService.writeDataToCollectionFile(id, oldData);
          this.stateService.ADD_COLLECTION(
            id,
            file.replace(/\.[^/.]+$/, ''),
            new Date().toISOString()
          );
        }
      }

      // Try to import the active collection
      const data = localStorage.getItem(
        'PersistentStatefulService-ScenesCollectionsService'
      );

      if (data) {
        const parsed = JSON.parse(data);

        if (parsed['activeCollection']) {
          const name = parsed['activeCollection'];
          const collection = this.collections.find(coll => coll.name === name);

          if (collection) await this.setActiveCollection(collection.id);
        }
      }
    }
  }
}
