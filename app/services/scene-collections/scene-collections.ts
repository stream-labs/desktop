import { Service } from 'services/service';
import { Inject } from 'util/injector';
import { SceneCollectionsServerApiService } from 'services/scene-collections/server-api';
import { RootNode } from './nodes/root';
import { SourcesNode, ISourceInfo } from './nodes/sources';
import { ScenesNode, ISceneSchema } from './nodes/scenes';
import { SceneItemsNode, ISceneItemInfo } from './nodes/scene-items';
import { TransitionsNode } from './nodes/transitions';
import { HotkeysNode } from './nodes/hotkeys';
import { SceneFiltersNode } from './nodes/scene-filters';
import path from 'path';
import electron from 'electron';
import fs from 'fs';
import { parse } from './parse';
import { ScenesService } from 'services/scenes';
import { SourcesService } from 'services/sources';
import { E_AUDIO_CHANNELS } from 'services/audio';
import { AppService } from 'services/app';
import { RunInLoadingMode } from 'services/app/app-decorators';
import { HotkeysService } from 'services/hotkeys';
import namingHelpers from '../../util/NamingHelpers';
import { WindowsService } from 'services/windows';
import { UserService } from 'services/user';
import { TcpServerService } from 'services/tcp-server';
import { OverlaysPersistenceService, IDownloadProgress } from './overlays';
import {
  ISceneCollectionsManifestEntry,
  ISceneCollectionSchema,
  ISceneCollectionsServiceApi,
  ISceneCollectionCreateOptions,
} from '.';
import { SceneCollectionsStateService } from './state';
import { Subject } from 'rxjs';
import { TransitionsService, ETransitionType } from 'services/transitions';
import { $t } from '../i18n';

const uuid = window['require']('uuid/v4');

export const NODE_TYPES = {
  RootNode,
  SourcesNode,
  ScenesNode,
  SceneItemsNode,
  TransitionsNode,
  HotkeysNode,
  SceneFiltersNode,
  TransitionNode: TransitionsNode, // Alias old name to new node
};

interface ISceneCollectionInternalCreateOptions extends ISceneCollectionCreateOptions {
  /** A function that can be used to set up some state.
   * This should really only be used by the OBS importer.
   */
  setupFunction?: () => boolean;
}

const DEFAULT_COLLECTION_NAME = 'Scenes';

/**
 * V2 of the scene collections service:
 * - Completely asynchronous
 * - Server side backup
 */
export class SceneCollectionsService extends Service implements ISceneCollectionsServiceApi {
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
  @Inject() tcpServerService: TcpServerService;
  @Inject() transitionsService: TransitionsService;

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
   * Whether a valid collection is currently loaded.
   * Is used to decide whether we should save.
   */
  private collectionLoaded = false;

  /**
   * true if the scene-collections sync in progress
   */
  private syncPending = false;

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
      let latestId = this.collections[0].id;
      let latestModified = this.collections[0].modified;

      this.collections.forEach(collection => {
        if (collection.modified > latestModified) {
          latestModified = collection.modified;
          latestId = collection.id;
        }
      });

      await this.load(latestId);
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
    await this.initialize();
  }

  /**
   * Generally called on application shutdown.
   */
  async deinitialize() {
    await this.disableAutoSave();
    await this.save();
    await this.deloadCurrentApplicationState();
    await this.safeSync();
    await this.stateService.flushManifestFile();
  }

  /**
   * Saves the current scene collection
   */
  async save(): Promise<void> {
    if (!this.collectionLoaded) return;
    if (!this.activeCollection) return;
    await this.saveCurrentApplicationStateAs(this.activeCollection.id);
    this.stateService.SET_MODIFIED(this.activeCollection.id, new Date().toISOString());
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
  @RunInLoadingMode()
  async load(id: string, shouldAttemptRecovery = true): Promise<void> {
    await this.deloadCurrentApplicationState();
    try {
      await this.setActiveCollection(id);
      await this.readCollectionDataAndLoadIntoApplicationState(id);
    } catch (e) {
      console.error('Error loading collection!', e);

      if (shouldAttemptRecovery) {
        await this.attemptRecovery(id);
      } else {
        console.warn(`Unsuccessful recovery of scene collection ${id} attempted`);
        alert('Failed to load scene collection.  A new one will be created instead.');
        await this.create();
      }
    }
  }

  /**
   * Creates and switches to a new blank scene collection
   *
   * @param options An optional object containing a setup function
   * @see {ISceneCollectionCreateOptions}
   */
  @RunInLoadingMode()
  async create(
    options: ISceneCollectionInternalCreateOptions = {},
  ): Promise<ISceneCollectionsManifestEntry> {
    await this.deloadCurrentApplicationState();

    const name = options.name || this.suggestName(DEFAULT_COLLECTION_NAME);
    const id = uuid();

    await this.insertCollection(id, name);
    await this.setActiveCollection(id);
    if (options.needsRename) this.stateService.SET_NEEDS_RENAME(id);

    if (options.setupFunction && options.setupFunction()) {
      // Do nothing
    } else {
      this.setupEmptyCollection();
    }

    this.collectionLoaded = true;
    await this.save();
    return this.getCollection(id);
  }

  /**
   * Deletes a scene collection.  If no id is specified, it
   * will delete the current collection.
   * @param id the id of the collection to delete
   */
  async delete(id?: string): Promise<void> {
    // tslint:disable-next-line:no-parameter-reassignment TODO
    id = id || this.activeCollection.id;
    const removingActiveCollection = id === this.activeCollection.id;

    if (removingActiveCollection) {
      this.appService.runInLoadingMode(async () => {
        await this.removeCollection(id);

        if (this.collections.length > 0) {
          await this.load(this.collections[0].id);
        } else {
          await this.create();
        }
      });
    } else {
      await this.removeCollection(id);
    }
  }

  /**
   * Renames a scene collection.
   * @param name the name of the new scene collection
   * @param id if not present, will operate on the current collection
   */
  async rename(name: string, id?: string) {
    this.stateService.RENAME_COLLECTION(
      id || this.activeCollection.id,
      name,
      new Date().toISOString(),
    );
    await this.safeSync();
    this.collectionUpdated.next(this.getCollection(id));
  }

  /**
   * Calls sync, but will never cause a rejected promise.
   * Instead, it will log an error and continue.
   */
  async safeSync(retries = 2) {
    if (this.syncPending) {
      console.error(
        'Unable to start the scenes-collection sync process while prev process is not finished',
      );
      return;
    }

    this.syncPending = true;
    try {
      await this.sync();
    } catch (e) {
      console.error(`Scene collection sync failed (Attempt ${3 - retries}/3)`, e);
      if (retries > 0) await this.safeSync(retries - 1);
    }

    this.syncPending = false;
  }

  /**
   * Duplicates a scene collection.
   * @param name the name of the new scene collection
   * @param id An optional ID, if omitted the active collection ID is used
   */
  async duplicate(name: string, id?: string) {
    await this.disableAutoSave();

    // tslint:disable-next-line:no-parameter-reassignment TODO
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
  @RunInLoadingMode()
  async installOverlay(
    url: string,
    name: string,
    progressCallback?: (info: IDownloadProgress) => void,
  ) {
    const pathName = await this.overlaysPersistenceService.downloadOverlay(url, progressCallback);
    const collectionName = this.suggestName(name);
    await this.loadOverlay(pathName, collectionName);
  }

  /**
   * Install a new overlay from a file path
   * @param filePath the location of the overlay file
   * @param name the name of the overlay
   */
  @RunInLoadingMode()
  async loadOverlay(filePath: string, name: string) {
    await this.deloadCurrentApplicationState();

    const id: string = uuid();
    await this.insertCollection(id, name);
    await this.setActiveCollection(id);

    try {
      await this.overlaysPersistenceService.loadOverlay(filePath);
      this.setupDefaultAudio();
    } catch (e) {
      // We tried really really hard :(
      console.error('Overlay installation failed', e);
    }

    this.collectionLoaded = true;
    await this.save();
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
   * Show the window to manage scene collections
   */
  showManageWindow() {
    this.windowsService.showWindow({
      componentName: 'ManageSceneCollections',
      title: $t('Manage Scene Collections'),
      size: {
        width: 700,
        height: 800,
      },
    });
  }

  /**
   * Returns the collection with the specified id
   * @param id the id of the collection
   */
  getCollection(id: string): ISceneCollectionsManifestEntry {
    return this.collections.find(coll => coll.id === id);
  }

  /**
   * Used by StreamDeck and platform API.
   * This method is potentially *very* expensive
   */
  fetchSceneCollectionsSchema(): Promise<ISceneCollectionSchema[]> {
    const promises: Promise<ISceneCollectionSchema>[] = [];

    this.collections.forEach(collection => {
      const data = this.stateService.readCollectionFile(collection.id);

      promises.push(
        new Promise<ISceneCollectionSchema>(resolve => {
          const root = parse(data, NODE_TYPES);
          const collectionSchema: ISceneCollectionSchema = {
            id: collection.id,
            name: collection.name,

            scenes: root.data.scenes.data.items.map((sceneData: ISceneSchema) => {
              return {
                id: sceneData.id,
                name: sceneData.name,
                sceneItems: sceneData.sceneItems.data.items.map((sceneItemData: ISceneItemInfo) => {
                  return {
                    sceneItemId: sceneItemData.id,
                    sourceId: sceneItemData.sourceId,
                  };
                }),
              };
            }),

            sources: root.data.sources.data.items.map((sourceData: ISourceInfo) => {
              return {
                id: sourceData.id,
                name: sourceData.name,
                type: sourceData.type,
                channel: sourceData.channel,
              };
            }),
          };

          resolve(collectionSchema);
        }),
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
   * from disk into the current application state.
   * @param id The id of the collection to load
   */
  private async readCollectionDataAndLoadIntoApplicationState(id: string): Promise<void> {
    const exists = await this.stateService.collectionFileExists(id);

    if (exists) {
      let data: string;

      try {
        data = this.stateService.readCollectionFile(id);
        if (data == null) throw new Error('Got blank data from collection file');

        await this.loadDataIntoApplicationState(data);
      } catch (e) {
        /*
         * FIXME: we invoke `loadDataIntoApplicationState` a second time below,
         *  which can cause partial state from the call above to still
         *  be present and result in duplicate items (for instance, scenes)
         *  and methods being invoked (like `updateRegisteredHotkeys`) as
         *  part of the loading process.
         */
        console.error('Error while loading collection, restoring backup', e);
        // Check for a backup and load it
        const exists = await this.stateService.collectionFileExists(id, true);

        // If there's no backup, throw the original error
        if (!exists) throw e;

        data = this.stateService.readCollectionFile(id, true);
        await this.loadDataIntoApplicationState(data);
      }

      if (this.scenesService.scenes.length === 0) {
        throw new Error('Scene collection was loaded but there were no scenes.');
      }

      // Everything was successful, write a backup
      this.stateService.writeDataToCollectionFile(id, data, true);
      this.collectionLoaded = true;
    } else {
      await this.attemptRecovery(id);
    }
  }

  /**
   * Parses and loads the given JSON string into application state
   * @param data Scene collection JSON data
   */
  private async loadDataIntoApplicationState(data: string) {
    const root = parse(data, NODE_TYPES);
    await root.load();
    this.hotkeysService.bindHotkeys();
  }

  /**
   * Writes the current application state to a file with the given id
   * @param id the id to save under
   */
  private async saveCurrentApplicationStateAs(id: string) {
    const root = new RootNode();
    await root.save();
    const data = JSON.stringify(root, null, 2);

    this.stateService.writeDataToCollectionFile(id, data);
  }

  /**
   * Attempts to recover and load a copy of this scene
   * collection from the server.
   * @param id The id of the collection to recover
   */
  private async attemptRecovery(id: string) {
    // Check if the server has a copy
    const collection = this.collections.find(coll => coll.id === id);

    if (collection.serverId && this.userService.isLoggedIn()) {
      const coll = await this.serverApi.fetchSceneCollection(collection.serverId);

      if (coll.scene_collection.data) {
        // A local hard delete without notifying the server
        // will force a fresh download from the server on next sync
        this.stateService.HARD_DELETE_COLLECTION(id);
        await this.safeSync();

        // Find the newly downloaded collection and load it
        const newCollection = this.collections.find(coll => coll.serverId === collection.serverId);

        if (newCollection) {
          await this.load(newCollection.id, false);
          return;
        }
      }
    }
  }

  /**
   * This deloads all scenes and sources and gets the application
   * ready to load a new config file.  This should only ever be
   * performed while the application is already in a "LOADING" state.
   */
  private async deloadCurrentApplicationState() {
    if (!this.initialized) return;

    this.tcpServerService.stopRequestsHandling();

    this.collectionWillSwitch.next();

    await this.disableAutoSave();
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

      this.transitionsService.deleteAllTransitions();
      this.transitionsService.deleteAllConnections();
    } catch (e) {
      console.error(new Error('Error deloading application state'));
    }

    this.hotkeysService.clearAllHotkeys();
    this.collectionLoaded = false;
  }

  /**
   * Creates the scenes and sources that come in by default
   * in an empty scene collection.
   */
  private setupEmptyCollection() {
    this.scenesService.createScene('Scene', { makeActive: true });
    this.setupDefaultAudio();
    this.transitionsService.ensureTransition();
  }

  /**
   * Creates the default audio sources
   */
  private setupDefaultAudio() {
    this.sourcesService.createSource(
      'Desktop Audio',
      'wasapi_output_capture',
      {},
      { channel: E_AUDIO_CHANNELS.OUTPUT_1 },
    );

    this.sourcesService.createSource(
      'Mic/Aux',
      'wasapi_input_capture',
      {},
      { channel: E_AUDIO_CHANNELS.INPUT_1 },
    );
  }

  /**
   * Creates and persists new collection from the current application state
   */
  private async insertCollection(id: string, name: string) {
    await this.saveCurrentApplicationStateAs(id);
    this.stateService.ADD_COLLECTION(id, name, new Date().toISOString());
    await this.safeSync();
    this.collectionAdded.next(this.collections.find(coll => coll.id === id));
  }

  /**
   * Deletes on the server and removes from the store
   */
  private async removeCollection(id: string) {
    this.collectionRemoved.next(this.collections.find(coll => coll.id === id));
    this.stateService.DELETE_COLLECTION(id);
    await this.safeSync();

    // Currently we don't remove files on disk in case we need to recover them
    // manually at a later point in time.  Once we are more comfortable with
    // the system, we can start actually deleting files from disk.
  }

  private autoSaveInterval: number;
  private autoSavePromise: Promise<void>;

  enableAutoSave() {
    if (this.autoSaveInterval) return;
    this.autoSaveInterval = window.setInterval(async () => {
      this.autoSavePromise = this.save();
      await this.autoSavePromise;
      this.stateService.flushManifestFile();
    }, 60 * 1000);
  }

  async disableAutoSave() {
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    this.autoSaveInterval = null;

    // Wait for the current saving process to finish
    if (this.autoSavePromise) await this.autoSavePromise;
  }

  private async setActiveCollection(id: string) {
    const collection = this.collections.find(coll => coll.id === id);

    if (collection) {
      if (collection.serverId && this.userService.isLoggedIn()) {
        try {
          await this.serverApi.makeSceneCollectionActive(collection.serverId);
        } catch (e) {
          console.warn('Failed setting active collection');
        }
      }
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
    if (!this.canSync()) return;

    const serverCollections = (await this.serverApi.fetchSceneCollections()).data;

    let failed = false;

    for (const onServer of serverCollections) {
      const inManifest = this.stateService.state.collections.find(
        coll => coll.serverId === onServer.id,
      );

      if (inManifest) {
        if (inManifest.deleted) {
          const success = await this.performSyncStep('Delete on server', async () => {
            await this.serverApi.deleteSceneCollection(inManifest.serverId);
            this.stateService.HARD_DELETE_COLLECTION(inManifest.id);
          });

          if (!success) failed = true;
        } else if (new Date(inManifest.modified) > new Date(onServer.last_updated_at)) {
          const success = await this.performSyncStep('Update on server', async () => {
            const exists = await this.stateService.collectionFileExists(inManifest.id);

            if (exists) {
              const data = this.stateService.readCollectionFile(inManifest.id);

              if (data) {
                await this.serverApi.updateSceneCollection({
                  data,
                  id: inManifest.serverId,
                  name: inManifest.name,
                  last_updated_at: inManifest.modified,
                });
              }
            }
          });

          if (!success) failed = true;
        } else if (new Date(inManifest.modified) < new Date(onServer.last_updated_at)) {
          const success = await this.performSyncStep('Update from server', async () => {
            const response = await this.serverApi.fetchSceneCollection(onServer.id);
            this.stateService.writeDataToCollectionFile(
              inManifest.id,
              response.scene_collection.data,
            );

            this.stateService.RENAME_COLLECTION(
              inManifest.id,
              onServer.name,
              onServer.last_updated_at,
            );
          });

          if (!success) failed = true;
        } else {
          console.log('Up to date file: ', inManifest.id);
        }
      } else {
        const success = await this.performSyncStep('Insert from server', async () => {
          const id: string = uuid();
          const response = await this.serverApi.fetchSceneCollection(onServer.id);

          // Empty data means that the collection was created from the Streamlabs
          // dashboard and does not currently have any scenes assoicated with it.
          // The first time we try to load this collection, we will initialize it
          // with some scenes.

          if (response.scene_collection.data != null) {
            this.stateService.writeDataToCollectionFile(id, response.scene_collection.data);
          }

          this.stateService.ADD_COLLECTION(id, onServer.name, onServer.last_updated_at);
          this.stateService.SET_SERVER_ID(id, onServer.id);
        });

        if (!success) failed = true;
      }
    }

    for (const inManifest of this.stateService.state.collections) {
      const onServer = serverCollections.find(coll => coll.id === inManifest.serverId);

      // We already dealt with the overlap above
      if (!onServer) {
        if (!inManifest.serverId) {
          const success = await this.performSyncStep('Insert on server', async () => {
            const data = this.stateService.readCollectionFile(inManifest.id);

            const response = await this.serverApi.createSceneCollection({
              data,
              name: inManifest.name,
              last_updated_at: inManifest.modified,
            });

            this.stateService.SET_SERVER_ID(inManifest.id, response.id);
          });

          if (!success) failed = true;
        } else {
          const success = this.performSyncStep('Delete from server', async () => {
            this.stateService.HARD_DELETE_COLLECTION(inManifest.id);
          });

          if (!success) failed = true;
        }
      }
    }

    await this.stateService.flushManifestFile();

    if (failed) throw new Error('Sync failed!');
  }

  /**
   * Performs a sync step, catches any errors, and returns
   * true/false depending on whether the step succeeded
   */
  private async performSyncStep(name: string, stepRunner: () => Promise<void>): Promise<boolean> {
    try {
      await stepRunner();
      console.debug(`Sync step succeeded: ${name}`);
      return true;
    } catch (e) {
      console.error(`Sync step failed: ${name}`, e);
      return false;
    }
  }

  /**
   * Migrates to V2 scene collections if needed.
   */
  private async migrate() {
    const legacyExists = await new Promise<boolean>(resolve => {
      fs.exists(this.legacyDirectory, exists => resolve(exists));
    });

    const newExists = await new Promise<boolean>(resolve => {
      fs.exists(this.stateService.collectionsDirectory, exists => resolve(exists));
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
        return !!name;
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
            new Date().toISOString(),
          );
        }
      }

      // Try to import the active collection
      const data = localStorage.getItem('PersistentStatefulService-ScenesCollectionsService');

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

  canSync(): boolean {
    return this.userService.isLoggedIn() && !this.appService.state.argv.includes('--nosync');
  }
}
