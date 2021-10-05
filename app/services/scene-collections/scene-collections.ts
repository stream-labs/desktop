import { Service } from 'services/core/service';
import { Inject } from 'services/core/injector';
import { SceneCollectionsServerApiService } from 'services/scene-collections/server-api';
import { RootNode } from './nodes/root';
import { SourcesNode, ISourceInfo } from './nodes/sources';
import { ScenesNode, ISceneSchema } from './nodes/scenes';
import { SceneItemsNode, ISceneItemInfo } from './nodes/scene-items';
import { TransitionsNode } from './nodes/transitions';
import { HotkeysNode } from './nodes/hotkeys';
import { SceneFiltersNode } from './nodes/scene-filters';
import path from 'path';
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
import { TcpServerService } from 'services/api/tcp-server';
import { OverlaysPersistenceService } from './overlays';
import { IDownloadProgress } from 'util/requests';
import {
  ISceneCollectionsManifestEntry,
  ISceneCollectionSchema,
  ISceneCollectionsServiceApi,
  ISceneCollectionCreateOptions,
} from '.';
import { SceneCollectionsStateService } from './state';
import { Subject } from 'rxjs';
import { TransitionsService } from 'services/transitions';
import { $t } from '../i18n';
import { StreamingService, EStreamingState } from 'services/streaming';
import { DefaultHardwareService } from 'services/hardware';
import { byOS, OS, getOS } from 'util/operating-systems';
import Utils from 'services/utils';
import { OutputSettingsService } from '../settings';
import * as remote from '@electron/remote';

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

  auto?: boolean;
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
  @Inject() streamingService: StreamingService;
  @Inject() private defaultHardwareService: DefaultHardwareService;
  @Inject() private outputSettingsService: OutputSettingsService;

  collectionAdded = new Subject<ISceneCollectionsManifestEntry>();
  collectionRemoved = new Subject<ISceneCollectionsManifestEntry>();
  collectionSwitched = new Subject<ISceneCollectionsManifestEntry>();
  collectionWillSwitch = new Subject<void>();
  collectionUpdated = new Subject<ISceneCollectionsManifestEntry>();
  collectionInitialized = new Subject<void>();

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
    await this.stateService.loadManifestFile();
    await this.migrateOS();
    await this.safeSync();
    if (this.activeCollection && this.activeCollection.operatingSystem === getOS()) {
      await this.load(this.activeCollection.id, true);
    } else if (this.loadableCollections.length > 0) {
      let latestId = this.loadableCollections[0].id;
      let latestModified = this.loadableCollections[0].modified;

      this.loadableCollections.forEach(collection => {
        if (collection.modified > latestModified) {
          latestModified = collection.modified;
          latestId = collection.id;
        }
      });

      await this.load(latestId);
    } else {
      await this.create({ auto: true });
    }
    this.collectionInitialized.next();
  }

  /**
   * Should be called when a new user logs in.  If the user has
   * scene collections backed up on the server, it will reset
   * the manifest and load from the server.
   */
  @RunInLoadingMode()
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
      this.collectionSwitched.next(this.getCollection(id)!);
    } catch (e: unknown) {
      console.error('Error loading collection!', e);

      if (shouldAttemptRecovery) {
        await this.attemptRecovery(id);
      } else {
        console.warn(`Unsuccessful recovery of scene collection ${id} attempted`);
        remote.dialog.showMessageBox(Utils.getMainWindow(), {
          title: 'Streamlabs OBS',
          message: $t('Failed to load scene collection.  A new one will be created instead.'),
        });
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

    const collection = await this.insertCollection(id, name, getOS(), options.auto || false);
    await this.setActiveCollection(id);
    if (options.needsRename) this.stateService.SET_NEEDS_RENAME(id);

    if (options.setupFunction && options.setupFunction()) {
      // Do nothing
    } else {
      this.setupEmptyCollection();
    }

    this.collectionLoaded = true;
    await this.save();
    this.collectionSwitched.next(collection);
    return collection;
  }

  /**
   * Deletes a scene collection.  If no id is specified, it
   * will delete the current collection.
   * @param id the id of the collection to delete
   */
  async delete(id?: string): Promise<void> {
    const collId = id ?? this.activeCollection?.id;

    if (collId == null) return;

    const removingActiveCollection = collId === this.activeCollection?.id;

    if (removingActiveCollection) {
      await this.appService.runInLoadingMode(async () => {
        await this.removeCollection(collId);

        if (this.loadableCollections.length > 0) {
          await this.load(this.loadableCollections[0].id);
        } else {
          await this.create();
        }
      });
    } else {
      await this.removeCollection(collId);
    }
  }

  /**
   * Renames a scene collection.
   * @param name the name of the new scene collection
   * @param id if not present, will operate on the current collection
   */
  async rename(name: string, id?: string) {
    const collId = id ?? this.activeCollection?.id;

    if (!collId) return;

    this.stateService.RENAME_COLLECTION(collId, name, new Date().toISOString());
    await this.safeSync();
    const coll = this.getCollection(collId);
    if (coll) this.collectionUpdated.next(coll);
  }

  /**
   * Calls sync, but will never cause a rejected promise.
   * Instead, it will log an error and continue.
   */
  async safeSync(retries = 2) {
    if (!this.canSync()) return;

    if (this.syncPending) {
      console.error(
        'Unable to start the scenes-collection sync process while prev process is not finished',
      );
      return;
    }

    this.syncPending = true;
    try {
      await this.sync();
      this.syncPending = false;
    } catch (e: unknown) {
      this.syncPending = false;

      console.error(`Scene collection sync failed (Attempt ${3 - retries}/3)`, e);
      if (retries > 0) await this.safeSync(retries - 1);
    }
  }

  /**
   * Duplicates a scene collection.
   * @param name the name of the new scene collection
   * @param id An optional ID, if omitted the active collection ID is used
   */
  async duplicate(name: string, id?: string) {
    const oldId = id ?? this.activeCollection?.id;
    if (oldId == null) return;

    const oldColl = this.getCollection(oldId);
    if (!oldColl) return;

    await this.disableAutoSave();

    const newId = uuid();
    await this.insertCollection(newId, name, oldColl.operatingSystem, false, oldId);
    this.stateService.SET_NEEDS_RENAME(newId);
    this.enableAutoSave();
  }

  downloadProgress = new Subject<IDownloadProgress>();

  /**
   * Install a new overlay from a URL
   * @param url the URL of the overlay file
   * @param name the name of the overlay
   * @param progressCallback a callback that receives progress of the download
   */
  @RunInLoadingMode({ hideStyleBlockers: false })
  async installOverlay(url: string, name: string) {
    const pathName = await this.overlaysPersistenceService.downloadOverlay(
      url,
      (progress: IDownloadProgress) => {
        this.downloadProgress.next(progress);
      },
    );
    const collectionName = this.suggestName(name);
    await this.loadOverlay(pathName, collectionName);

    // repair scene collection in the case if it has any issues
    this.scenesService.repair();
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
    const collection = await this.insertCollection(id, name, getOS());
    await this.setActiveCollection(id);

    try {
      await this.overlaysPersistenceService.loadOverlay(filePath);
      this.setupDefaultAudio();
    } catch (e: unknown) {
      // We tried really really hard :(
      console.error('Overlay installation failed', e);
    }

    this.collectionSwitched.next(collection);

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

  get loadableCollections() {
    return this.collections.filter(c => c.operatingSystem === getOS());
  }

  /**
   * Returns the collection with the specified id
   * @param id the id of the collection
   */
  getCollection(id: string): ISceneCollectionsManifestEntry | null {
    return this.collections.find(coll => coll.id === id) ?? null;
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
      } catch (e: unknown) {
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

      if (this.scenesService.views.scenes.length === 0) {
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
    const root: RootNode = parse(data, NODE_TYPES);

    // TODO: This is an edge case now that scene collections are segmented by OS
    // Ideally we don't ever hit this.
    if (!root.data.sources.isAllSupported()) {
      const backupName = `${this.activeCollection?.name} - Backup`;

      await this.duplicate(backupName);
      await remote.dialog.showMessageBox(Utils.getMainWindow(), {
        title: 'Unsupported Sources',
        type: 'warning',
        message: `The scene collection you are loading has sources that are not supported by your current operating system. These sources will be removed before loading the scene collection. A backup of this collection with the original sources preserved has been created with the name: ${backupName}`,
      });
    }

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
    if (collection == null) return;

    if (collection.serverId && this.userService.isLoggedIn) {
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
    this.tcpServerService.stopRequestsHandling();

    this.collectionWillSwitch.next();

    await this.disableAutoSave();
    await this.save();

    // we should remove inactive scenes first to avoid the switching between scenes
    try {
      this.scenesService.views.scenes.forEach(scene => {
        if (scene.id === this.scenesService.views.activeSceneId) return;
        scene.remove(true);
      });

      if (this.scenesService.views.activeScene) {
        this.scenesService.views.activeScene.remove(true);
      }

      this.sourcesService.views.sources.forEach(source => {
        if (source.type !== 'scene') source.remove();
      });

      this.transitionsService.deleteAllTransitions();
      this.transitionsService.deleteAllConnections();

      this.streamingService.setSelectiveRecording(false);
    } catch (e: unknown) {
      console.error('Error deloading application state', e);
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
    // On macOS, most users will not have an audio capture device, so
    // we do not create it automatically.
    if (getOS() === OS.Windows) {
      this.sourcesService.createSource(
        'Desktop Audio',
        byOS({ [OS.Windows]: 'wasapi_output_capture', [OS.Mac]: 'coreaudio_output_capture' }),
        {},
        { channel: E_AUDIO_CHANNELS.OUTPUT_1 },
      );
    }

    const defaultId = this.defaultHardwareService.state.defaultAudioDevice
      ? this.defaultHardwareService.state.defaultAudioDevice
      : undefined;
    this.sourcesService.createSource(
      'Mic/Aux',
      byOS({ [OS.Windows]: 'wasapi_input_capture', [OS.Mac]: 'coreaudio_input_capture' }),
      { device_id: defaultId },
      { channel: E_AUDIO_CHANNELS.INPUT_1 },
    );
  }

  /**
   * Creates and persists new collection from the current application state
   * or from another scene collection's contents.
   */
  private async insertCollection(id: string, name: string, os: OS, auto = false, fromId?: string) {
    if (fromId) {
      await this.stateService.copyCollectionFile(fromId, id);
    } else {
      await this.saveCurrentApplicationStateAs(id);
    }

    this.stateService.ADD_COLLECTION(id, name, new Date().toISOString(), os, auto);
    await this.safeSync();
    const collection = this.getCollection(id)!;
    this.collectionAdded.next(collection);

    return collection;
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

  private autoSaveInterval: number | null;
  private autoSavePromise: Promise<void>;

  enableAutoSave() {
    if (this.autoSaveInterval) return;
    this.autoSaveInterval = window.setInterval(async () => {
      if (this.streamingService.state.streamingStatus === EStreamingState.Live) return;

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
      if (collection.serverId && this.userService.isLoggedIn) {
        this.serverApi
          .makeSceneCollectionActive(collection.serverId)
          .catch(e => console.warn('Failed setting active collection'));
      }
      this.stateService.SET_ACTIVE_COLLECTION(id);
    }
  }

  private get legacyDirectory() {
    return path.join(this.appService.appDataDirectory, 'SceneConfigs');
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
            if (inManifest.serverId) {
              await this.serverApi.deleteSceneCollection(inManifest.serverId);
            }
            this.stateService.HARD_DELETE_COLLECTION(inManifest.id);
          });

          if (!success) failed = true;
        } else if (new Date(inManifest.modified) > new Date(onServer.last_updated_at)) {
          const success = await this.performSyncStep('Update on server', async () => {
            const exists = await this.stateService.collectionFileExists(inManifest.id);

            if (exists) {
              const data = this.stateService.readCollectionFile(inManifest.id);

              if (data && inManifest.serverId) {
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

            if (response.scene_collection.data) {
              this.stateService.writeDataToCollectionFile(
                inManifest.id,
                response.scene_collection.data,
              );
            } else {
              console.error(`Server returned empty data for collection ${inManifest.id}`);
            }

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

          let operatingSystem = getOS();

          // Empty data means that the collection was created from the Streamlabs
          // dashboard and does not currently have any scenes assoicated with it.
          // The first time we try to load this collection, we will initialize it
          // with some scenes.

          if (response.scene_collection.data != null) {
            this.stateService.writeDataToCollectionFile(id, response.scene_collection.data);

            // Attempt to pull the OS out of the data, assuming Windows if it is not marked
            operatingSystem =
              JSON.parse(response.scene_collection.data).operatingSystem || OS.Windows;
          }

          this.stateService.ADD_COLLECTION(
            id,
            onServer.name,
            onServer.last_updated_at,
            operatingSystem,
          );
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
          // Delete any auto collections if there are any collections that were
          // downloaded from the server.
          if (
            this.loadableCollections.filter(c => c.id !== inManifest.id).length &&
            inManifest.auto
          ) {
            const success = this.performSyncStep('Delete from server', async () => {
              this.stateService.HARD_DELETE_COLLECTION(inManifest.id);
            });

            if (!success) failed = true;
          } else {
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
          }
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
    } catch (e: unknown) {
      console.error(`Sync step failed: ${name}`, e);
      return false;
    }
  }

  migrateOS() {
    // Assume all unmarked scene collections are Windows
    this.collections
      .filter(c => !c.operatingSystem)
      .forEach(c => {
        this.stateService.SET_OPERATING_SYSTEM(c.id, OS.Windows);
      });
  }

  canSync(): boolean {
    return this.userService.isLoggedIn && !this.appService.state.argv.includes('--nosync');
  }
}
