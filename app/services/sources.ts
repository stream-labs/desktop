import Vue from 'vue';
import { Subject } from 'rxjs/Subject';
import {
  TFormData,
  IListOption,
  getPropertiesFormData,
  setPropertiesFormData,
  setupSourceDefaults
} from '../components/shared/forms/Input';
import { StatefulService, mutation, ServiceHelper } from './stateful-service';
import * as obs from '../../obs-api';
import electron from 'electron';
import Utils from './utils';
import { ScenesService, ISceneItem } from './scenes';
import { Inject } from '../util/injector';
import namingHelpers from '../util/NamingHelpers';
import { WindowsService } from './windows';
import { WidgetType } from './widgets';

const { ipcRenderer } = electron;

const AudioFlag = obs.EOutputFlags.Audio;
const VideoFlag = obs.EOutputFlags.Video;
const DoNotDuplicateFlag = obs.EOutputFlags.DoNotDuplicate;

const SOURCES_UPDATE_INTERVAL = 1000;

export interface ISource {
  sourceId: string;
  name: string;
  type: TSourceType;
  audio: boolean;
  video: boolean;
  muted: boolean;
  width: number;
  height: number;
  doNotDuplicate: boolean;
  channel?: number;
}


export interface ISourceApi extends ISource {
  displayName: string;
  updateSettings(settings: Dictionary<any>): void;
  getSettings(): Dictionary<any>;
  getPropertiesFormData(): TFormData;
  setPropertiesFormData(properties: TFormData): void;
}


export interface ISourcesServiceApi {
  createSource(name: string, type: TSourceType, options: ISourceCreateOptions): Source;
  getAvailableSourcesTypes(): IListOption<TSourceType>[];
  getSources(): ISourceApi[];
  getSource(sourceId: string): ISourceApi;
  getSourceByName(name: string): ISourceApi;
  suggestName(name: string): string;
  showSourceProperties(sourceId: string): void;
  showAddSource(): void;
  showNameSource(sourceType: TSourceType): void;
  showNameWidget(widgetType: WidgetType): void;
}


export interface ISourceCreateOptions {
  channel?: number;
  sourceId?: string; // A new ID will be generated if one is not specified
}

export type TSourceType =
  'image_source' |
  'color_source' |
  'browser_source' |
  'slideshow' |
  'ffmpeg_source' |
  'text_gdiplus' |
  'text_ft2_source' |
  'monitor_capture' |
  'window_capture' |
  'game_capture' |
  'dshow_input' |
  'wasapi_input_capture' |
  'wasapi_output_capture';

interface ISourcesState {
  sources: Dictionary<ISource>;
}


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
      (sceneSourceState) => this.onSceneSourceRemovedHandler(sceneSourceState)
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

    const obsInput = obs.InputFactory.create(type, name, settings);

    this.addSource(obsInput, id, options);

    return this.getSource(id);
  }

  addSource(obsInput: obs.IInput, id: string, options: ISourceCreateOptions) {
    if (options.channel !== void 0) {
      obs.Global.setOutputSource(options.channel, obsInput);
    }
    setupSourceDefaults(obsInput);
    const type: TSourceType = obsInput.id as TSourceType;
    this.ADD_SOURCE(id, obsInput.name, type, options.channel);
    const source = this.state.sources[id];
    const muted = obsInput.muted;
    this.UPDATE_SOURCE({ id, muted });
    this.updateSourceFlags(source, obsInput.outputFlags);

    this.sourceAdded.next(source);
  }

  removeSource(id: string) {
    const source = this.getSource(id);
    source.getObsInput().release();
    this.REMOVE_SOURCE(id);
    this.sourceRemoved.next(source.sourceState);
  }


  suggestName(name: string): string {
    return namingHelpers.suggestName(name, (name: string) => this.getSourceByName(name));
  }


  private onSceneSourceRemovedHandler(sceneSourceState: ISceneItem) {
    // remove source if it has been removed from the all scenes
    if (this.scenesService.getSourceScenes(sceneSourceState.sourceId).length > 0) return;
    this.removeSource(sceneSourceState.sourceId);
  }


  getAvailableSourcesTypes(): IListOption<TSourceType>[] {
    return [
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
      { description: 'Audio Output Capture', value: 'wasapi_output_capture' }
    ];
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


  showAddSource() {
    this.windowsService.showWindow({
      componentName: 'AddSource',
      size: {
        width: 800,
        height: 520
      }
    });
  }


  showNameSource(sourceType: TSourceType) {
    this.windowsService.showWindow({
      componentName: 'NameSource',
      queryParams: { sourceType },
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

@ServiceHelper()
export class Source implements ISourceApi {
  sourceId: string;
  name: string;
  type: TSourceType;
  audio: boolean;
  video: boolean;
  muted: boolean;
  width: number;
  height: number;
  doNotDuplicate: boolean;
  channel?: number;

  sourceState: ISource;

  /**
   * displayName can be localized in future releases
   */
  get displayName() {
    if (this.name === 'AuxAudioDevice1') return 'Mic/Aux';
    if (this.name === 'DesktopAudioDevice1') return 'Desktop Audio';
    const desktopDeviceMatch = /^DesktopAudioDevice(\d)$/.exec(this.name);
    const auxDeviceMatch = /^AuxAudioDevice(\d)$/.exec(this.name);

    if (desktopDeviceMatch) {
      const index = parseInt(desktopDeviceMatch[1], 10);
      return 'Desktop Audio' + (index > 1 ? ' ' + index : '');
    }

    if (auxDeviceMatch) {
      const index = parseInt(auxDeviceMatch[1], 10);
      return 'Mic/Aux' + (index > 1 ? ' ' + index : '');
    }

    return this.name;
  }


  getObsInput(): obs.IInput {
    return obs.InputFactory.fromName(this.name);
  }


  updateSettings(settings: Dictionary<any>) {
    this.getObsInput().update(settings);
  }


  getSettings(): Dictionary<any> {
    return this.getObsInput().settings;
  }


  getPropertiesFormData(): TFormData {
    return getPropertiesFormData(this.getObsInput());
  }


  setPropertiesFormData(properties: TFormData) {
    setPropertiesFormData(this.getObsInput(), properties);
  }


  duplicate(): Source {
    if (this.doNotDuplicate) return null;
    return this.sourcesService.createSource(
      this.sourcesService.suggestName(this.name),
      this.type,
      this.getSettings()
    );
  }


  remove() {
    this.sourcesService.removeSource(this.sourceId);
  }


  @Inject()
  protected sourcesService: SourcesService;

  constructor(sourceId: string) {
    // Using a proxy will ensure that this object
    // is always up-to-date, and essentially acts
    // as a view into the store.  It also enforces
    // the read-only nature of this data
    this.sourceState = this.sourcesService.state.sources[sourceId];
    Utils.applyProxy(this, this.sourcesService.state.sources[sourceId]);
  }
}

