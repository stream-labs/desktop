import { StatefulService, mutation } from '../stateful-service';
import { OnboardingService } from '../onboarding';
import {
  ScenesCollectionsService,
  OverlaysPersistenceService,
  IDownloadProgress
} from '../scenes-collections';
import { HotkeysService } from '../hotkeys';
import { UserService } from '../user';
import { ShortcutsService } from '../shortcuts';
import { Inject } from '../../util/injector';
import electron from 'electron';
import { ScenesTransitionsService } from '../scenes-transitions';
import { SourcesService } from '../sources';
import { ScenesService } from '../scenes';
import { VideoService } from '../video';
import { StreamInfoService } from '../stream-info';
import { track } from '../usage-statistics';
import { IpcServerService } from '../ipc-server';
import { TcpServerService } from '../tcp-server';
import { IAppServiceApi } from './app-api';
import { StreamlabelsService } from '../streamlabels';
import { PerformanceMonitorService } from '../performance-monitor';
import { SceneCollectionsService } from 'services/scene-collections';

interface IAppState {
  loading: boolean;
  argv: string[];
}

/**
 * Performs operations that happen once at startup and shutdown. This service
 * mainly calls into other services to do the heavy lifting.
 */
export class AppService extends StatefulService<IAppState>
  implements IAppServiceApi {
  @Inject() onboardingService: OnboardingService;
  @Inject() scenesCollectionsService: ScenesCollectionsService;
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() overlaysPersistenceService: OverlaysPersistenceService;
  @Inject() hotkeysService: HotkeysService;
  @Inject() userService: UserService;
  @Inject() shortcutsService: ShortcutsService;
  @Inject() streamInfoService: StreamInfoService;

  static initialState: IAppState = {
    loading: true,
    argv: []
  };

  private autosaveInterval: number;

  @Inject() scenesTransitionsService: ScenesTransitionsService;
  @Inject() sourcesService: SourcesService;
  @Inject() scenesService: ScenesService;
  @Inject() videoService: VideoService;
  @Inject() streamlabelsService: StreamlabelsService;
  @Inject() private ipcServerService: IpcServerService;
  @Inject() private tcpServerService: TcpServerService;
  @Inject() private performanceMonitorService: PerformanceMonitorService;

  @track('app_start')
  load() {
    let loadingPromise: Promise<void>;
    this.START_LOADING();

    // We want to start this as early as possible so that any
    // exceptions raised while loading the configuration are
    // associated with the user in sentry.
    this.userService;

    // Will create a new scene collection if there isn't one
    loadingPromise = this.sceneCollectionsService.initialize();

    loadingPromise.then(() => {
      this.onboardingService.startOnboardingIfRequired();

      electron.ipcRenderer.on('shutdown', () => {
        electron.ipcRenderer.send('acknowledgeShutdown');
        this.shutdownHandler();
      });

      this.shortcutsService;
      this.streamlabelsService;

      // Pre-fetch stream info
      this.streamInfoService;

      this.performanceMonitorService.start();

      this.ipcServerService.listen();
      this.tcpServerService.listen();
      this.FINISH_LOADING();
    });
  }

  /**
   * reset current scene collection and load new one
   */
  loadConfig(
    configName?: string,
    options = { saveCurrent: true }
  ): Promise<void> {
    return new Promise(resolve => {
      this.START_LOADING();

      window.setTimeout(() => {
        // wait while current config will be saved
        (options.saveCurrent
          ? this.scenesCollectionsService.rawSave()
          : Promise.resolve()
        ).then(() => {
          this.reset();

          this.scenesCollectionsService.load(configName).then(() => {
            this.scenesService.makeSceneActive(
              this.scenesService.activeSceneId
            );
            this.hotkeysService.bindHotkeys();
            this.enableAutoSave();
            this.FINISH_LOADING();
            resolve();
          });
        });
      }, 500);
    });
  }

  /**
   * the main process sends argv string here
   */
  setArgv(argv: string[]) {
    this.SET_ARGV(argv);
  }

  /**
   * Loads an overlay file as a new scene collection
   * @param collectionName The name of the new scene collection
   * @param overlayPath The path to the overlay file
   */
  async loadOverlay(collectionName: string, overlayPath: string) {
    this.START_LOADING();

    // Make sure the current collection is saved
    await this.scenesCollectionsService.rawSave();

    this.reset();
    this.scenesCollectionsService.switchToEmptyConfig(collectionName);
    await this.overlaysPersistenceService.loadOverlay(overlayPath);
    this.scenesService.makeSceneActive(this.scenesService.scenes[0].id);
    this.scenesService.activeScene.makeItemsActive([]);

    // Save the newly loaded config
    await this.scenesCollectionsService.rawSave();

    this.enableAutoSave();
    this.FINISH_LOADING();
  }

  /**
   * Downloads and installs an overlay
   * @param url the URL of the overlay
   * @param name the name of the overlay
   */
  async installOverlay(url: string, name:string, progressCallback?: (info: IDownloadProgress) => void) {
    this.START_LOADING();

    let pathName: string;

    // A download error should not result in an infinite spinner
    try {
      pathName = await this.overlaysPersistenceService.downloadOverlay(url, progressCallback);
    } catch (e) {
      this.FINISH_LOADING();
      throw e;
    }

    const configName = this.scenesCollectionsService.suggestName(name);

    await this.loadOverlay(configName, pathName);
  }

  /**
   * remove the config and load the new one
   */
  async removeCurrentConfig() {
    this.START_LOADING();
    this.disableAutosave();
    this.scenesCollectionsService.removeConfig();
    if (this.scenesCollectionsService.hasConfigs()) {
      this.loadConfig('', { saveCurrent: false });
    } else {
      await this.switchToBlankConfig();
    }
  }

  /**
   * reset current scenes and switch to blank config
   */
  async switchToBlankConfig(configName?: string) {
    this.reset();
    this.scenesCollectionsService.switchToBlankConfig(configName);
    await this.scenesCollectionsService.rawSave();
    this.enableAutoSave();
    this.FINISH_LOADING();
  }

  @track('app_close')
  private shutdownHandler() {
    this.START_LOADING();

    window.setTimeout(async () => {
      await this.sceneCollectionsService.deinitialize();

      this.ipcServerService.stopListening();
      this.tcpServerService.stopListening();

      // if (this.scenesCollectionsService.state.activeCollection) {
      //   await this.scenesCollectionsService.rawSave();
      // }

      this.reset();
      this.performanceMonitorService.stop();
      this.videoService.destroyAllDisplays();
      this.scenesTransitionsService.reset();
      electron.ipcRenderer.send('shutdownComplete');
    }, 300);
  }

  /**
   * cleanup all created objects
   */
  reset() {
    this.disableAutosave();

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

  startLoading() {
    this.START_LOADING();
  }

  finishLoading() {
    this.FINISH_LOADING();
  }

  private enableAutoSave() {
    this.autosaveInterval = window.setInterval(() => {
      this.scenesCollectionsService.save();
    }, 60 * 1000);
  }

  private disableAutosave() {
    clearInterval(this.autosaveInterval);
  }

  @mutation()
  private START_LOADING() {
    this.state.loading = true;
  }

  @mutation()
  private FINISH_LOADING() {
    this.state.loading = false;
  }

  @mutation()
  private SET_ARGV(argv: string[]) {
    this.state.argv = argv;
  }
}
