import * as fs from 'fs';
import Vue from 'vue';
import { Subject } from 'rxjs';
import cloneDeep from 'lodash/cloneDeep';
import { IObsListOption, TObsValue } from 'components/obs/inputs/ObsInput';
import { StatefulService, mutation } from 'services/core/stateful-service';
import * as obs from '../../../obs-api';
import { Inject } from 'services/core/injector';
import namingHelpers from 'util/NamingHelpers';
import { WindowsService } from 'services/windows';
import { DefaultManager } from './properties-managers/default-manager';
import { ScenesService, ISceneItem } from 'services/scenes';
import {
  IActivePropertyManager,
  ISource,
  ISourceAddOptions,
  ISourcesServiceApi,
  ISourcesState,
  TSourceType,
  Source,
  TPropertiesManager,
} from './index';
import { $t } from 'services/i18n';
import { AudioService } from '../audio';
import uuid from 'uuid/v4';

const AudioFlag = obs.ESourceOutputFlags.Audio;
const VideoFlag = obs.ESourceOutputFlags.Video;
const AsyncFlag = obs.ESourceOutputFlags.Async;
const DoNotDuplicateFlag = obs.ESourceOutputFlags.DoNotDuplicate;

export const PROPERTIES_MANAGER_TYPES = {
  default: DefaultManager,
};

interface IObsSourceCallbackInfo {
  name: string;
  width: number;
  height: number;
  flags: number;
}

export class SourcesService extends StatefulService<ISourcesState> implements ISourcesServiceApi {
  static initialState = {
    sources: {},
    temporarySources: {}, // don't save temporarySources in the config file
  } as ISourcesState;

  sourceAdded = new Subject<ISource>();
  sourceUpdated = new Subject<ISource>();
  sourceRemoved = new Subject<ISource>();

  @Inject() private scenesService: ScenesService;
  @Inject() private windowsService: WindowsService;
  @Inject() private audioService: AudioService;

  /**
   * Maps a source id to a property manager
   */
  propertiesManagers: Dictionary<IActivePropertyManager> = {};

  protected init() {
    obs.NodeObs.RegisterSourceCallback((objs: IObsSourceCallbackInfo[]) =>
      this.handleSourceCallback(objs),
    );

    this.scenesService.itemRemoved.subscribe(sceneSourceModel =>
      this.onSceneItemRemovedHandler(sceneSourceModel),
    );

    this.scenesService.sceneRemoved.subscribe(sceneModel => this.removeSource(sceneModel.id));
  }

  @mutation()
  private RESET_SOURCES() {
    this.state.sources = {};
  }

  @mutation()
  private ADD_SOURCE(addOptions: {
    id: string;
    name: string;
    type: TSourceType;
    channel?: number;
    isTemporary?: boolean;
    propertiesManagerType?: TPropertiesManager;
  }) {
    const id = addOptions.id;
    const sourceModel: ISource = {
      sourceId: id,
      name: addOptions.name,
      type: addOptions.type,
      propertiesManagerType: addOptions.propertiesManagerType || 'default',

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
      channel: addOptions.channel,
      deinterlaceMode: obs.EDeinterlaceMode.Disable,
      deinterlaceFieldOrder: obs.EDeinterlaceFieldOrder.Top,
    };

    if (addOptions.isTemporary) {
      Vue.set(this.state.temporarySources, id, sourceModel);
    } else {
      Vue.set(this.state.sources, id, sourceModel);
    }
  }

  @mutation()
  private REMOVE_SOURCE(id: string) {
    if (this.state.sources[id]) {
      Vue.delete(this.state.sources, id);
    } else {
      Vue.delete(this.state.temporarySources, id);
    }
  }

  @mutation()
  private UPDATE_SOURCE(sourcePatch: TPatch<ISource>) {
    if (this.state.sources[sourcePatch.id]) {
      Object.assign(this.state.sources[sourcePatch.id], sourcePatch);
    } else {
      Object.assign(this.state.temporarySources[sourcePatch.id], sourcePatch);
    }
  }

  createSource(
    name: string,
    type: TSourceType,
    settings: Dictionary<any> = {},
    options: ISourceAddOptions = {},
  ): Source {
    const id: string = options.sourceId || `${type}_${uuid()}`;
    const obsInputSettings = this.getObsSourceCreateSettings(type, settings);
    const obsInput = obs.InputFactory.create(type, id, obsInputSettings);

    this.addSource(obsInput, name, options);

    return this.getSource(id);
  }

  addSource(obsInput: obs.IInput, name: string, options: ISourceAddOptions = {}) {
    if (options.channel !== void 0) {
      obs.Global.setOutputSource(options.channel, obsInput);
    }
    const id = obsInput.name;
    const type: TSourceType = obsInput.id as TSourceType;
    const managerType = options.propertiesManager || 'default';
    this.ADD_SOURCE({
      id,
      name,
      type,
      channel: options.channel,
      isTemporary: options.isTemporary,
      propertiesManagerType: managerType,
    });
    const source = this.getSource(id);
    const muted = obsInput.muted;
    this.UPDATE_SOURCE({ id, muted });
    this.updateSourceFlags(source.state, obsInput.outputFlags, true);

    const managerKlass = PROPERTIES_MANAGER_TYPES[managerType];
    this.propertiesManagers[id] = {
      manager: new managerKlass(obsInput, options.propertiesManagerSettings || {}),
      type: managerType,
    };

    this.sourceAdded.next(source.state);
    if (options.audioSettings) this.audioService.getSource(id).setSettings(options.audioSettings);
  }

  removeSource(id: string) {
    const source = this.getSource(id);

    if (!source) throw new Error(`Source ${id} not found`);

    /* When we release sources, we need to make
     * sure we reset the channel it's set to,
     * otherwise OBS thinks it's still attached
     * and won't release it. */
    if (source.channel !== void 0) {
      obs.Global.setOutputSource(source.channel, null);
    }

    this.REMOVE_SOURCE(id);
    this.propertiesManagers[id].manager.destroy();
    delete this.propertiesManagers[id];
    this.sourceRemoved.next(source.state);
    source.getObsInput().release();
  }

  addFile(path: string): Source {
    const SUPPORTED_EXT = {
      image_source: ['png', 'jpg', 'jpeg', 'tga', 'bmp'],
      ffmpeg_source: [
        'mp4',
        'ts',
        'mov',
        'flv',
        'mkv',
        'avi',
        'mp3',
        'ogg',
        'aac',
        'wav',
        'gif',
        'webm',
      ],
      browser_source: ['html'],
      text_gdiplus: ['txt'],
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
          local_file: path,
        };
      } else if (type === 'ffmpeg_source') {
        settings = {
          is_local_file: true,
          local_file: path,
          looping: true,
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

  getObsSourceSettings(type: TSourceType, settings: Dictionary<any>): Dictionary<any> {
    const resolvedSettings = cloneDeep(settings);

    Object.keys(resolvedSettings).forEach(propName => {
      // device_id is unique for each PC
      // so we allow to provide a device name instead device id
      // resolve the device id by the device name here
      if (!['device_id', 'video_device_id', 'audio_device_id'].includes(propName)) return;

      /* N Airには hardwareService がないため無効
      const device =
        type === 'dshow_input'
          ? this.hardwareService.getDshowDeviceByName(settings[propName])
          : this.hardwareService.getDeviceByName(settings[propName]);

      if (!device) return;
      resolvedSettings[propName] = device.id;
      */
    });
    return resolvedSettings;
  }

  fixSourceSettings() {
    // fix webcam sources's video_device_id
    this.getSourcesByType('dshow_input').forEach(webcam => {
      webcam.getPropertiesFormData();
    });
  }

  private getObsSourceCreateSettings(type: TSourceType, settings: Dictionary<any>) {
    const resolvedSettings = this.getObsSourceSettings(type, settings);

    // setup default settings
    if (type === 'browser_source') {
      if (resolvedSettings.shutdown === void 0) resolvedSettings.shutdown = true;
      if (resolvedSettings.url === void 0) {
        resolvedSettings.url = 'https://n-air-app.nicovideo.jp/browser-source/';
      }
    }

    if (type === 'text_gdiplus') {
      if (resolvedSettings.text === void 0) resolvedSettings.text = name;
    }
    return resolvedSettings;
  }

  getAvailableSourcesTypesList(): IObsListOption<TSourceType>[] {
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
      'liv_capture',
      'ovrstream_dc_source',
      'vlc_source',
    ];

    const availableWhitelistedType = whitelistedTypes.filter(type =>
      obsAvailableTypes.includes(type),
    );
    // 'scene' is not an obs input type so we have to set it manually
    availableWhitelistedType.push('scene');

    const availableWhitelistedSourceType = availableWhitelistedType.map(value => ({
      value,
      description: $t(`source-props.${value}.name`),
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

      if (
        source.width !== sourcesSize[index].width ||
        source.height !== sourcesSize[index].height
      ) {
        const size = {
          id: item.sourceId,
          width: sourcesSize[index].width,
          height: sourcesSize[index].height,
        };
        this.UPDATE_SOURCE(size);
      }
      this.updateSourceFlags(source, sourcesSize[index].outputFlags);
    });
  }

  private handleSourceCallback(objs: IObsSourceCallbackInfo[]) {
    objs.forEach(info => {
      const source = this.getSource(info.name);

      // This is probably a transition or something else we don't care about
      if (!source) return;

      if (source.width !== info.width || source.height !== info.height) {
        const size = { id: source.sourceId, width: info.width, height: info.height };
        this.UPDATE_SOURCE(size);
      }
      this.updateSourceFlags(source, info.flags);
    });
  }

  private updateSourceFlags(source: ISource, flags: number, doNotEmit?: boolean) {
    const audio = !!(AudioFlag & flags);
    const video = !!(VideoFlag & flags);
    const async = !!(AsyncFlag & flags);
    const doNotDuplicate = !!(DoNotDuplicateFlag & flags);

    if (source.audio !== audio || source.video !== video || source.async !== async) {
      this.UPDATE_SOURCE({ id: source.sourceId, audio, video, async, doNotDuplicate });

      if (!doNotEmit) this.sourceUpdated.next(source);
    }
  }

  setMuted(id: string, muted: boolean) {
    const source = this.getSource(id);
    source.getObsInput().muted = muted;
    this.UPDATE_SOURCE({ id, muted });
    this.sourceUpdated.next(source.state);
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

  getSourcesByType(type: TSourceType): Source[] {
    const sourceModels = Object.values(this.state.sources).filter(source => {
      return source.type === type;
    });
    return sourceModels.map(sourceModel => this.getSource(sourceModel.sourceId));
  }

  get sources(): Source[] {
    return Object.values(this.state.sources).map(sourceModel =>
      this.getSource(sourceModel.sourceId),
    );
  }

  getSource(id: string): Source {
    return this.state.sources[id] || this.state.temporarySources[id] ? new Source(id) : void 0;
  }

  getSources() {
    return this.sources;
  }

  showSourceProperties(sourceId: string) {
    const source = this.getSource(sourceId);

    this.windowsService.showWindow({
      componentName: 'SourceProperties',
      title: $t('sources.propertyWindowTitle', { sourceName: source.name }),
      queryParams: { sourceId },
      size: {
        width: 600,
        height: 600,
      },
    });
  }

  showShowcase() {
    this.windowsService.showWindow({
      componentName: 'SourcesShowcase',
      title: $t('sources.addSourceTitle'),
      size: {
        width: 680,
        height: 600,
      },
    });
  }

  showAddSource(sourceType: TSourceType, sourceAddOptions?: ISourceAddOptions) {
    this.windowsService.showWindow({
      componentName: 'AddSource',
      title: $t('sources.addSourceTitle'),
      queryParams: { sourceType, sourceAddOptions },
      size: {
        width: 640,
        height: 600,
      },
    });
  }

  showRenameSource(sourceId: string) {
    this.windowsService.showWindow({
      componentName: 'RenameSource',
      title: $t('sources.renameSource'),
      queryParams: { sourceId },
      size: {
        width: 400,
        height: 250,
      },
    });
  }
}
