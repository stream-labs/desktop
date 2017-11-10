import Vue from 'vue';
import { Subject } from 'rxjs/Subject';
import { IListOption, setupSourceDefaults } from 'components/shared/forms/Input';
import { StatefulService, mutation } from 'services/stateful-service';
import * as obs from '../../../obs-api';
import electron from 'electron';
import { Inject } from 'util/injector';
import namingHelpers from 'util/NamingHelpers';
import { WindowsService } from 'services/windows';
import { WidgetType } from 'services/widgets';
import { DefaultManager } from './properties-managers/default-manager';
import { WidgetManager } from './properties-managers/widget-manager';
import { ScenesService, ISceneItem } from 'services/scenes';
import {
  IActivePropertyManager, ISource, ISourceCreateOptions, ISourcesServiceApi, ISourcesState,
  TSourceType,
  Source,
  TPropertiesManager
} from './index';



const SOURCES_UPDATE_INTERVAL = 1000;

const { ipcRenderer } = electron;

const AudioFlag = obs.EOutputFlags.Audio;
const VideoFlag = obs.EOutputFlags.Video;
const DoNotDuplicateFlag = obs.EOutputFlags.DoNotDuplicate;

const PROPERTIES_MANAGER_TYPES = {
  default: DefaultManager,
  widget: WidgetManager
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
        const source = this.getSourceByName(update.name);

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
      doNotDuplicate: false,

      // Unscaled width and height
      width: 0,
      height: 0,

      muted: false,
      channel
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

    const id: string = options.sourceId || ipcRenderer.sendSync('getUniqueId');

    if ((type === 'browser_source') && (settings.shutdown === void 0)) {
      settings.shutdown = true;
    }

    const obsInput = obs.InputFactory.create(type, name, settings);

    this.addSource(obsInput, id, options);

    return this.getSource(id);
  }

  addSource(obsInput: obs.IInput, id: string, options: ISourceCreateOptions = {}) {
    if (options.channel !== void 0) {
      obs.Global.setOutputSource(options.channel, obsInput);
    }
    const type: TSourceType = obsInput.id as TSourceType;
    this.ADD_SOURCE(id, obsInput.name, type, options.channel);
    const source = this.getSource(id);
    const muted = obsInput.muted;
    this.UPDATE_SOURCE({ id, muted });
    this.updateSourceFlags(source.sourceState, obsInput.outputFlags);

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
    source.getObsInput().release();
    this.REMOVE_SOURCE(id);
    this.propertiesManagers[id].manager.destroy();
    delete this.propertiesManagers[id];
    this.sourceRemoved.next(source.sourceState);
  }


  suggestName(name: string): string {
    return namingHelpers.suggestName(name, (name: string) => this.getSourceByName(name));
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
    const whitelistedTypes: IListOption<TSourceType>[] = [
      { description: 'Image', value: 'image_source' },
      { description: 'Color Source', value: 'color_source' },
      { description: 'Browser Source', value: 'browser_source' },
      { description: 'Media Source', value: 'ffmpeg_source' },
      { description: 'Image Slide Show', value: 'slideshow' },
      { description: 'Text (GDI+)', value: 'text_gdiplus' },
      { description: 'Text (FreeType 2)', value: 'text_ft2_source' },
      { description: 'Display Capture', value: 'monitor_capture' },
      { description: 'Window Capture', value: 'window_capture' },
      { description: 'Game Capture', value: 'game_capture' },
      { description: 'Video Capture Device', value: 'dshow_input' },
      { description: 'Audio Input Capture', value: 'wasapi_input_capture' },
      { description: 'Audio Output Capture', value: 'wasapi_output_capture' },
      { description: 'Blackmagic Device', value: 'decklink-input' }
    ];

    const availableWhitelistedType = whitelistedTypes.filter(type => obsAvailableTypes.includes(type.value));
    // 'scene' is not an obs input type so we have to set it manually
    availableWhitelistedType.push({ description: 'Scene', value: 'scene' });

    return availableWhitelistedType;
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
        sourcesNames.push(activeItem.name);
      });
      ipcRenderer.send('requestSourceAttributes', sourcesNames);
    }
  }

  private updateSourceFlags(source: ISource, flags: number) {
    const audio = !!(AudioFlag & flags);
    const video = !!(VideoFlag & flags);
    const doNotDuplicate = !!(DoNotDuplicateFlag & flags);

    if ((source.audio !== audio) || (source.video !== video)) {
      this.UPDATE_SOURCE({ id: source.sourceId, audio, video, doNotDuplicate });
      this.sourceUpdated.next(source);
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


  getSourceByName(name: string): Source {
    const sourceModel = Object.values(this.state.sources).find(source => {
      return source.name === name;
    });
    return sourceModel ? this.getSource(sourceModel.sourceId) : void 0;
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
    this.windowsService.showWindow({
      componentName: 'SourceProperties',
      queryParams: { sourceId },
      size: {
        width: 600,
        height: 800
      }
    });
  }


  showShowcase() {
    this.windowsService.showWindow({
      componentName: 'SourcesShowcase',
      size: {
        width: 800,
        height: 630
      }
    });
  }


  showAddSource(sourceType: TSourceType, propertiesManager?: TPropertiesManager) {
    this.windowsService.showWindow({
      componentName: 'AddSource',
      queryParams: { sourceType, propertiesManager },
      size: {
        width: 600,
        height: 540
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


  showRenameSource(sourceName: string) {
    this.windowsService.showWindow({
      componentName: 'NameSource',
      queryParams: { rename: sourceName },
      size: {
        width: 400,
        height: 250
      }
    });
  }


  showNameWidget(widgetType: WidgetType) {
    this.windowsService.showWindow({
      componentName: 'NameSource',
      queryParams: { widgetType: String(widgetType) },
      size: {
        width: 400,
        height: 250
      }
    });
  }

}


