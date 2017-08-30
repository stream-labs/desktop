import Vue from 'vue';
import { Subject } from 'rxjs/Subject';
import {
  TFormData,
  inputValuesToObsValues,
  obsValuesToInputValues, IListOption
} from '../components/shared/forms/Input';
import { StatefulService, mutation, ServiceHelper } from './stateful-service';
import { nodeObs } from './obs-api';
import * as obs from '../../obs-api';
import electron from '../vendor/electron';
import Utils from './utils';
import { ScenesService, ISceneItem } from './scenes';
import { Inject } from '../util/injector';
import namingHelpers from '../util/NamingHelpers';

const { ipcRenderer } = electron;

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
  properties: TFormData;
  channel?: number;
}


export interface ISourceApi extends ISource {
  displayName: string;
  updateSettings(settings: Dictionary<any>): void;
  getSettings(): Dictionary<any>;
}


export interface ISourcesServiceApi {
  createSource(name: string, type: TSourceType, options: ISourceCreateOptions): Source;
  getAvailableSourcesTypes(): IListOption<TSourceType>[];
  getPropertiesFormData(sourceId: string): TFormData;
  setProperties(sourceId: string, properties: TFormData): void;
  getSources(): ISourceApi[];
  getSource(sourceId: string): ISourceApi;
  getSourceByName(name: string): ISourceApi;
  suggestName(name: string): string;
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


  protected init() {
    setInterval(() => this.refreshSourceAttributes(), SOURCES_UPDATE_INTERVAL);
    this.scenesService.sourceRemoved.subscribe(
      (sceneSourceState) => this.onSceneSourceRemovedHandler(sceneSourceState)
    );
  }

  @mutation()
  private RESET_SOURCES() {
    this.state.sources = {};
  }

  @mutation()
  private ADD_SOURCE(id: string, name: string, type: TSourceType, properties: TFormData, channel?: number) {
    const sourceModel: ISource = {
      sourceId: id,
      name,
      type,
      properties,

      // Whether the source has audio and/or video
      // Will be updated periodically
      audio: false,
      video: false,

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

    if (options.channel !== void 0) {
      obs.Global.setOutputSource(options.channel, obsInput);
    }

    const properties = this.getPropertiesFormData(id);

    this.ADD_SOURCE(id, name, type, properties, options.channel);
    const source = this.state.sources[id];
    const muted = nodeObs.OBS_content_isSourceMuted(name);
    this.UPDATE_SOURCE({ id, muted });
    this.refreshSourceFlags(source, id);
    this.sourceAdded.next(source);
    return this.getSource(id);
  }

  removeSource(id: string) {
    const source = this.getSource(id);
    source.getObsInput().release();
    this.REMOVE_SOURCE(id);
    this.sourceRemoved.next(source.sourceState);
  }


  suggestName(name: string): string {
    return namingHelpers.suggestName(name, (name) => this.getSourceByName(name));
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


  refreshProperties(id: string) {
    const properties = this.getPropertiesFormData(id);

    this.UPDATE_SOURCE({ id, properties });
  }


  refreshSourceAttributes() {
    Object.keys(this.state.sources).forEach(id => {
      const source = this.state.sources[id];

      const size: {width: number, height: number } = nodeObs.OBS_content_getSourceSize(source.name);

      if ((source.width !== size.width) || (source.height !== size.height)) {
        const { width, height } = size;
        this.UPDATE_SOURCE({ id, width, height });
      }

      this.refreshSourceFlags(source, id);
    });
  }


  private refreshSourceFlags(source: ISource, id: string) {
    const flags = nodeObs.OBS_content_getSourceFlags(source.name);
    const audio = !!flags.audio;
    const video = !!flags.video;

    if ((source.audio !== audio) || (source.video !== video)) {
      this.UPDATE_SOURCE({ id, audio, video });
      this.sourceUpdated.next(source);
    }
  }


  setProperties(sourceId: string, properties: TFormData) {
    const source = this.state.sources[sourceId];
    const propertiesToSave = inputValuesToObsValues(properties, {
      boolToString: true,
      intToString: true,
      valueToObject: true
    });

    for (const prop of propertiesToSave) {
      // TODO: This is a temporary hack
      if (prop.name === 'font') {
        this.getSource(sourceId).getObsInput().update({ custom_font: prop.value.path });
      }

      nodeObs.OBS_content_setProperty(
        source.name,
        prop.name,
        prop.value
      );
    }

    this.refreshProperties(sourceId);
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


  getPropertiesFormData(sourceId: string) {
    const source = this.getSourceById(sourceId);
    if (!source) return [];

    const obsProps = nodeObs.OBS_content_getSourceProperties(source.name);
    const props = obsValuesToInputValues(obsProps, {
      boolIsString: true,
      valueIsObject: true,
      valueGetter: (propName) => {
        const val = nodeObs.OBS_content_getSourcePropertyCurrentValue(
          source.name,
          propName
        );

        // TODO: This is a temporary hack
        if (propName === 'font') {
          val.path = source.getObsInput().settings['custom_font'];
        }

        return val;
      },
      subParametersGetter: (propName) => {
        return nodeObs.OBS_content_getSourcePropertiesSubParameters(source.name, propName);
      }
    });

    return props;
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
  properties: TFormData;
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


  duplicate(): Source {
    return this.sourcesService.createSource(
      this.sourcesService.suggestName(this.name),
      this.type,
      this.getSettings()
    );
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

