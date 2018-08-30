import * as fs from 'fs';
import Vue from 'vue';
import { Subject } from 'rxjs/Subject';
import { IListOption, setupSourceDefaults, TObsValue } from 'components/shared/forms/Input';
import { StatefulService, mutation } from 'services/stateful-service';
import * as obs from '../../../obs-api';
import electron from 'electron';
import { Inject } from 'util/injector';
import namingHelpers from 'util/NamingHelpers';
import { WindowsService } from 'services/windows';
import { DefaultManager } from './properties-managers/default-manager';
import { ScenesService, ISceneItem } from 'services/scenes';
import {
  IActivePropertyManager, ISource, ISourceCreateOptions, ISourcesServiceApi, ISourcesState,
  TSourceType,
  Source,
  TPropertiesManager
} from './index';
import { $t } from '../i18n';


const SOURCES_UPDATE_INTERVAL = 1000;

const { ipcRenderer } = electron;

const AudioFlag = obs.ESourceOutputFlags.Audio;
const VideoFlag = obs.ESourceOutputFlags.Video;
const AsyncFlag = obs.ESourceOutputFlags.Async;
const DoNotDuplicateFlag = obs.ESourceOutputFlags.DoNotDuplicate;

export const PROPERTIES_MANAGER_TYPES = {
  default: DefaultManager,
};

export class SourcesService extends StatefulService<ISourcesState> implements ISourcesServiceApi {

  static initialState = {
    sources: {}
  } as ISourcesState;

  sourceAdded = new Subject<ISource>();
  sourceUpdated = new Subject<ISource>();
  sourceRemoved = new Subject<ISource>();

  @Inject()
  private scenesService: ScenesService;

  @Inject()
  private windowsService: WindowsService;

  /**
   * Maps a source id to a property manager
   */
  propertiesManagers: Dictionary<IActivePropertyManager> = {};


  protected init() {
    setInterval(() => this.requestSourceSizes(), SOURCES_UPDATE_INTERVAL);

    ipcRenderer.on('notifySourceAttributes', (e: Electron.Event, data: obs.ISourceSize[]) => {
      data.forEach(update => {
        const source = this.getSource(update.name);

        if (!source) return;

        if ((source.width !== update.width) || (source.height !== update.height)) {
          const size = { id: source.sourceId, width: update.width,
            height: update.height };
          this.UPDATE_SOURCE(size);
        }
        this.updateSourceFlags(source, update.outputFlags);
      });
    });

    this.scenesService.itemRemoved.subscribe(
      (sceneSourceModel) => this.onSceneItemRemovedHandler(sceneSourceModel)
    );

    this.scenesService.sceneRemoved.subscribe(
      (sceneModel) => this.removeSource(sceneModel.id)
    );
  }

  @mutation()
  private RESET_SOURCES() {
    this.state.sources = {};
  }

  @mutation()
  private ADD_SOURCE(id: string, name: string, type: TSourceType, channel?: number) {
    const sourceModel: ISource = {
      sourceId: id,
      name,
      type,

      // Whether the source has audio and/or video
      // Will be updated periodically
      audio: false,
      video: false,
      async: false,
      doNotDuplicate: false,

      // Unscaled width and height
      width: 0,
      height: 0,

      muted: false,
      resourceId: 'Source' + JSON.stringify([id]),
      channel,
      deinterlaceMode: obs.EDeinterlaceMode.Disable,
      deinterlaceFieldOrder: obs.EDeinterlaceFieldOrder.Top,
    };

    Vue.set(this.state.sources, id, sourceModel);
  }

  @mutation()
  private REMOVE_SOURCE(id: string) {
    Vue.delete(this.state.sources, id);
  }

  @mutation()
  private UPDATE_SOURCE(sourcePatch: TPatch<ISource>) {
    Object.assign(this.state.sources[sourcePatch.id], sourcePatch);
  }


  createSource(
    name: string,
    type: TSourceType,
    settings: Dictionary<any> = {},
    options: ISourceCreateOptions = {}
  ): Source {

    const id: string =
      options.sourceId ||
      (type + '_' + ipcRenderer.sendSync('getUniqueId'));

    if (type === 'browser_source') {
      if (settings.shutdown === void 0) settings.shutdown = true;
      if (settings.url === void 0) settings.url = 'https://n-air-app.nicovideo.jp/browser-source/';
    }

    if (type === 'text_gdiplus') {
      if (settings.text === void 0) settings.text = name;
    }

    const obsInput = obs.InputFactory.create(type, id, settings);

    this.addSource(obsInput, name, options);

    return this.getSource(id);
  }

  addSource(obsInput: obs.IInput, name: string, options: ISourceCreateOptions = {}) {
    if (options.channel !== void 0) {
      obs.Global.setOutputSource(options.channel, obsInput);
    }
    const id = obsInput.name;
    const type: TSourceType = obsInput.id as TSourceType;
    this.ADD_SOURCE(id, name, type, options.channel);
    const source = this.getSource(id);
    const muted = obsInput.muted;
    this.UPDATE_SOURCE({ id, muted });
    this.updateSourceFlags(source.sourceState, obsInput.outputFlags, true);

    const managerType = options.propertiesManager || 'default';
    const managerKlass = PROPERTIES_MANAGER_TYPES[managerType];
    this.propertiesManagers[id] = {
      manager: new managerKlass(obsInput, options.propertiesManagerSettings),
      type: managerType
    };

    if (source.hasProps()) setupSourceDefaults(obsInput);
    this.sourceAdded.next(source.sourceState);
  }

  removeSource(id: string) {
    const source = this.getSource(id);

    /* When we release sources, we need to make
     * sure we reset the channel it's set to,
     * otherwise OBS thinks it's still attached
     * and won't release it. */
    if (source.channel !== void 0) {
      obs.Global.setOutputSource(source.channel, null);
    }

    if (!source) throw  new Error(`Source ${id} not found`);

    source.getObsInput().release();
    this.REMOVE_SOURCE(id);
    this.propertiesManagers[id].manager.destroy();
    delete this.propertiesManagers[id];
    this.sourceRemoved.next(source.sourceState);
  }

  addFile(path: string): Source {
    const SUPPORTED_EXT = {
      image_source: ['png', 'jpg', 'jpeg', 'tga', 'bmp'],
      ffmpeg_source: ['mp4', 'ts', 'mov', 'flv', 'mkv', 'avi', 'mp3', 'ogg', 'aac', 'wav', 'gif', 'webm'],
      browser_source: ['html'],
      text_gdiplus: ['txt']
    };
    let ext = path.split('.').splice(-1)[0];
    if (!ext) return null;
    ext = ext.toLowerCase();
    const filename = path.split('\\').splice(-1)[0];

    const types = Object.keys(SUPPORTED_EXT);
    for (const type of types) {
      if (!SUPPORTED_EXT[type].includes(ext)) continue;
      let settings: Dictionary<TObsValue>;
      if (type === 'image_source') {
        settings = { file: path };
      } else if (type === 'browser_source') {
        settings = {
          is_local_file: true,
          local_file: path
        };
      } else if (type === 'ffmpeg_source') {
        settings = {
          is_local_file: true,
          local_file: path,
          looping: true
        };
      } else if (type === 'text_gdiplus') {
        settings = { text: fs.readFileSync(path).toString() };
      }
      return this.createSource(filename, type as TSourceType, settings);
    }
    return null;
  }

  suggestName(name: string): string {
    return namingHelpers.suggestName(name, (name: string) => this.getSourcesByName(name).length);
  }

  private onSceneItemRemovedHandler(sceneItemState: ISceneItem) {
    // remove source if it has been removed from the all scenes
    const source = this.getSource(sceneItemState.sourceId);

    if (source.type === 'scene') return;

    if (this.scenesService.getSourceScenes(source.sourceId).length > 0) return;
    this.removeSource(source.sourceId);
  }


  getAvailableSourcesTypesList(): IListOption<TSourceType>[] {
    const obsAvailableTypes = obs.InputFactory.types();
    const whitelistedTypes: TSourceType[] = [
      'image_source',
      'color_source',
      'browser_source',
      'ffmpeg_source',
      'slideshow',
      'text_gdiplus',
      'text_ft2_source',
      'monitor_capture',
      'window_capture',
      'game_capture',
      'dshow_input',
      'wasapi_input_capture',
      'wasapi_output_capture',
      'decklink-input',
      'ndi_source',
      'openvr_capture',
      'liv_capture'
    ];

    const availableWhitelistedType = whitelistedTypes.filter(type => obsAvailableTypes.includes(type));
    // 'scene' is not an obs input type so we have to set it manually
    availableWhitelistedType.push('scene');

    const availableWhitelistedSourceType =
      availableWhitelistedType.map((value) => ({
        value,
        description: $t(`source-props.${value}.name`)
      }));

    return availableWhitelistedSourceType;
  }

  getAvailableSourcesTypes(): TSourceType[] {
    return this.getAvailableSourcesTypesList().map(listItem => listItem.value);
  }

  refreshSourceAttributes() {
    const activeItems = this.scenesService.activeScene.getItems();
    const sourcesNames: string[] = [];

    activeItems.forEach(activeItem => {
      sourcesNames.push(activeItem.name);
    });

    const sourcesSize = obs.getSourcesSize(sourcesNames);

    activeItems.forEach((item, index) => {
      const source = this.state.sources[item.sourceId];

      if ((source.width !== sourcesSize[index].width) || (source.height !== sourcesSize[index].height)) {
        const size = { id: item.sourceId, width: sourcesSize[index].width,
          height: sourcesSize[index].height };
        this.UPDATE_SOURCE(size);
      }
      this.updateSourceFlags(source, sourcesSize[index].outputFlags);
    });
  }

  requestSourceSizes() {
    const activeScene = this.scenesService.activeScene;
    if (activeScene) {
      const activeItems = activeScene.getItems();
      const sourcesNames: string[] = [];

      activeItems.forEach(activeItem => {
        sourcesNames.push(activeItem.sourceId);
      });
      ipcRenderer.send('requestSourceAttributes', sourcesNames);
    }
  }

  private updateSourceFlags(source: ISource, flags: number, doNotEmit? : boolean) {
    const audio = !!(AudioFlag & flags);
    const video = !!(VideoFlag & flags);
    const async = !!(AsyncFlag & flags);
    const doNotDuplicate = !!(DoNotDuplicateFlag & flags);

    if ((source.audio !== audio) || (source.video !== video) || (source.async !== async)) {
      this.UPDATE_SOURCE({ id: source.sourceId, audio, video, async, doNotDuplicate });

      if (!doNotEmit) this.sourceUpdated.next(source);
    }
  }


  setMuted(id: string, muted: boolean) {
    const source = this.getSource(id);
    source.getObsInput().muted = muted;
    this.UPDATE_SOURCE({ id, muted });
    this.sourceUpdated.next(source.sourceState);
  }


  reset() {
    this.RESET_SOURCES();
  }

  // Utility functions / getters

  getSourceById(id: string): Source {
    return this.getSource(id);
  }


  getSourcesByName(name: string): Source[] {
    const sourceModels = Object.values(this.state.sources).filter(source => {
      return source.name === name;
    });
    return sourceModels.map(sourceModel => this.getSource(sourceModel.sourceId));
  }


  get sources(): Source[] {
    return Object.values(this.state.sources).map(sourceModel => this.getSource(sourceModel.sourceId));
  }


  getSource(id: string): Source {
    return this.state.sources[id] ? new Source(id) : void 0;
  }


  getSources() {
    return this.sources;
  }


  showSourceProperties(sourceId: string) {
    this.windowsService.closeChildWindow();
    this.windowsService.showWindow({
      componentName: 'SourceProperties',
      queryParams: { sourceId },
      size: {
        width: 600,
        height: 600
      }
    });
  }


  showShowcase() {
    this.windowsService.showWindow({
      componentName: 'SourcesShowcase',
      size: {
        width: 680,
        height: 600
      }
    });
  }


  showAddSource(sourceType: TSourceType, propertiesManager?: TPropertiesManager) {
    this.windowsService.showWindow({
      componentName: 'AddSource',
      queryParams: { sourceType, propertiesManager },
      size: {
        width: 640,
        height: 600
      }
    });
  }


  showNameSource(sourceType: TSourceType, propertiesManager?: TPropertiesManager) {
    this.windowsService.showWindow({
      componentName: 'NameSource',
      queryParams: { sourceType, propertiesManager },
      size: {
        width: 400,
        height: 250
      }
    });
  }


  showRenameSource(sourceId: string) {
    this.windowsService.showWindow({
      componentName: 'NameSource',
      queryParams: { renameId: sourceId },
      size: {
        width: 400,
        height: 250
      }
    });
  }
}

