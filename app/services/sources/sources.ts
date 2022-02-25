import * as fs from 'fs';
import Vue from 'vue';
import { Subject } from 'rxjs';
import cloneDeep from 'lodash/cloneDeep';
import { IObsListOption, TObsValue } from 'components/obs/inputs/ObsInput';
import { mutation, StatefulService, ViewHandler } from 'services/core/stateful-service';
import * as obs from '../../../obs-api';
import { Inject } from 'services/core/injector';
import namingHelpers from 'util/NamingHelpers';
import { WindowsService } from 'services/windows';
import { WidgetDisplayData, WidgetsService, WidgetType } from 'services/widgets';
import { DefaultManager } from './properties-managers/default-manager';
import { WidgetManager } from './properties-managers/widget-manager';
import { ISceneItem, Scene, ScenesService } from 'services/scenes';
import { StreamlabelsManager } from './properties-managers/streamlabels-manager';
import { PlatformAppManager } from './properties-managers/platform-app-manager';
import { UserService } from 'services/user';
import {
  IActivePropertyManager,
  ISource,
  ISourceAddOptions,
  ISourcesState,
  Source,
  TPropertiesManager,
  TSourceType,
} from './index';
import uuid from 'uuid/v4';
import { $t } from 'services/i18n';
import { SourceDisplayData } from './sources-data';
import { NavigationService } from 'services/navigation';
import { PlatformAppsService } from 'services/platform-apps';
import { HardwareService, DefaultHardwareService } from 'services/hardware';
import { AudioService, E_AUDIO_CHANNELS } from '../audio';
import { ReplayManager } from './properties-managers/replay-manager';
import { IconLibraryManager } from './properties-managers/icon-library-manager';
import { assertIsDefined } from 'util/properties-type-guards';
import { UsageStatisticsService } from 'services/usage-statistics';
import { SourceFiltersService } from 'services/source-filters';
import { VideoService } from 'services/video';
import { CustomizationService } from '../customization';
import { EAvailableFeatures, IncrementalRolloutService } from '../incremental-rollout';

const AudioFlag = obs.ESourceOutputFlags.Audio;
const VideoFlag = obs.ESourceOutputFlags.Video;
const AsyncFlag = obs.ESourceOutputFlags.Async;
const DoNotDuplicateFlag = obs.ESourceOutputFlags.DoNotDuplicate;

export const PROPERTIES_MANAGER_TYPES = {
  default: DefaultManager,
  widget: WidgetManager,
  streamlabels: StreamlabelsManager,
  platformApp: PlatformAppManager,
  replay: ReplayManager,
  iconLibrary: IconLibraryManager,
};

interface IObsSourceCallbackInfo {
  name: string;
  width: number;
  height: number;
  flags: number;
}

/**
 * These sources are valid on windows
 */
export const windowsSources: TSourceType[] = [
  'image_source',
  'color_source',
  'browser_source',
  'slideshow',
  'ffmpeg_source',
  'text_gdiplus',
  'monitor_capture',
  'window_capture',
  'game_capture',
  'dshow_input',
  'wasapi_input_capture',
  'wasapi_output_capture',
  'decklink-input',
  'scene',
  'ndi_source',
  'openvr_capture',
  'screen_capture',
  'liv_capture',
  'ovrstream_dc_source',
  'vlc_source',
  'soundtrack_source',
];

/**
 * These sources are valid on mac
 */
export const macSources: TSourceType[] = [
  'image_source',
  'color_source',
  'browser_source',
  'slideshow',
  'ffmpeg_source',
  'text_ft2_source',
  'scene',
  'coreaudio_input_capture',
  'coreaudio_output_capture',
  'av_capture_input',
  'display_capture',
  'audio_line',
  'ndi_source',
  'vlc_source',
  'window_capture',
  'syphon-input',
  'decklink-input',
];

class SourcesViews extends ViewHandler<ISourcesState> {
  get sources(): Source[] {
    return Object.values(this.state.sources).map(
      sourceModel => this.getSource(sourceModel.sourceId)!,
    );
  }

  get temporarySources(): Source[] {
    return Object.values(this.state.temporarySources).map(
      sourceModel => this.getSource(sourceModel.sourceId)!,
    );
  }

  getSource(id: string): Source | null {
    return this.state.sources[id] || this.state.temporarySources[id] ? new Source(id) : null;
  }

  getSourceByChannel(channel: E_AUDIO_CHANNELS): Source | null {
    const id = Object.values(this.state.sources).find(s => {
      return s.channel === channel;
    })?.sourceId;

    return id != null ? this.getSource(id) : null;
  }

  getSources() {
    return this.sources;
  }

  getSourcesByName(name: string): Source[] {
    const sourceModels = Object.values(this.state.sources).filter(source => {
      return source.name === name;
    });
    return sourceModels.map(sourceModel => this.getSource(sourceModel.sourceId)!);
  }
}

export class SourcesService extends StatefulService<ISourcesState> {
  static initialState = {
    sources: {},
    temporarySources: {}, // don't save temporarySources in the config file
  } as ISourcesState;

  sourceAdded = new Subject<ISource>();
  sourceUpdated = new Subject<ISource>();
  sourceRemoved = new Subject<ISource>();

  @Inject() private scenesService: ScenesService;
  @Inject() private windowsService: WindowsService;
  @Inject() private widgetsService: WidgetsService;
  @Inject() private userService: UserService;
  @Inject() private navigationService: NavigationService;
  @Inject() private platformAppsService: PlatformAppsService;
  @Inject() private hardwareService: HardwareService;
  @Inject() private audioService: AudioService;
  @Inject() private defaultHardwareService: DefaultHardwareService;
  @Inject() private usageStatisticsService: UsageStatisticsService;
  @Inject() private sourceFiltersService: SourceFiltersService;
  @Inject() private videoService: VideoService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private incrementalRolloutService: IncrementalRolloutService;

  get views() {
    return new SourcesViews(this.state);
  }

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
    configurable: boolean;
    width: number;
    height: number;
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

      configurable: addOptions.configurable,

      // Unscaled width and height
      width: addOptions.width,
      height: addOptions.height,

      muted: false,
      channel: addOptions.channel,
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

    // Universally disabled for security reasons
    if (obsInputSettings.is_media_flag) {
      obsInputSettings.is_media_flag = false;
    }

    const obsInput = obs.InputFactory.create(type, id, obsInputSettings);

    this.addSource(obsInput, name, options);

    if (
      this.defaultHardwareService.state.defaultVideoDevice === obsInputSettings.video_device_id &&
      this.defaultHardwareService.state.presetFilter !== ''
    ) {
      this.sourceFiltersService.addPresetFilter(id, this.defaultHardwareService.state.presetFilter);
    }
    return this.views.getSource(id)!;
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
      width: obsInput.width,
      height: obsInput.height,
      configurable: obsInput.configurable,
      channel: options.channel,
      isTemporary: options.isTemporary,
      propertiesManagerType: managerType,
    });
    const source = this.views.getSource(id)!;
    const muted = obsInput.muted;
    this.UPDATE_SOURCE({ id, muted });
    this.updateSourceFlags(source.state, obsInput.outputFlags, true);

    if (type === 'ndi_source') {
      this.usageStatisticsService.recordFeatureUsage('NDI');
    } else if (type === 'openvr_capture') {
      this.usageStatisticsService.recordFeatureUsage('OpenVR');
    } else if (type === 'screen_capture') {
      this.usageStatisticsService.recordFeatureUsage('SimpleCapture');
    } else if (type === 'vlc_source') {
      this.usageStatisticsService.recordFeatureUsage('VLC');
    } else if (type === 'soundtrack_source') {
      this.usageStatisticsService.recordFeatureUsage('soundtrackSource');
    } else if (type === 'wasapi_input_capture' || type === 'coreaudio_input_capture') {
      this.usageStatisticsService.recordFeatureUsage('AudioInputSource');
    } else if (type === 'dshow_input') {
      this.usageStatisticsService.recordFeatureUsage('DShowInput');

      const device = this.hardwareService.state.dshowDevices.find(
        d => d.id === obsInput.settings.video_device_id,
      );

      if (device) {
        this.usageStatisticsService.recordAnalyticsEvent('WebcamUse', {
          device: device.description,
        });
      }
    } else if (type === 'window_capture') {
      this.usageStatisticsService.recordFeatureUsage('WindowCapture');
    } else if (type === 'monitor_capture') {
      this.usageStatisticsService.recordFeatureUsage('DisplayCapture');
    } else if (type === 'game_capture') {
      this.usageStatisticsService.recordFeatureUsage('GameCapture');
    }

    const managerKlass = PROPERTIES_MANAGER_TYPES[managerType];
    this.propertiesManagers[id] = {
      manager: new managerKlass(obsInput, options.propertiesManagerSettings || {}, id),
      type: managerType,
    };

    this.sourceAdded.next(source.state);

    if (options.audioSettings) {
      this.audioService.views.getSource(id).setSettings(options.audioSettings);
    }
  }

  removeSource(id: string) {
    const source = this.views.getSource(id);

    if (!source) throw new Error(`Source ${id} not found`);

    /* When we release sources, we need to make
     * sure we reset the channel it's set to,
     * otherwise OBS thinks it's still attached
     * and won't release it. */
    if (source.channel !== void 0) {
      obs.Global.setOutputSource(source.channel, (null as unknown) as obs.ISource);
    }

    source.getObsInput().release();
    this.propertiesManagers[id].manager.destroy();
    delete this.propertiesManagers[id];
    this.REMOVE_SOURCE(id);
    this.sourceRemoved.next(source.state);
  }

  addFile(path: string): Source | null {
    const realpath = fs.realpathSync(path);
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
    let ext = realpath.split('.').splice(-1)[0];
    if (!ext) return null;
    ext = ext.toLowerCase();
    const filename = path.split('\\').splice(-1)[0];

    const types = Object.keys(SUPPORTED_EXT);
    for (const type of types) {
      if (!SUPPORTED_EXT[type].includes(ext)) continue;
      let settings: Dictionary<TObsValue> | null = null;
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
        settings = {
          read_from_file: true,
          file: path,
        };
      }
      if (settings) return this.createSource(filename, type as TSourceType, settings);
    }
    return null;
  }

  suggestName(name: string): string {
    return namingHelpers.suggestName(
      name,
      (name: string) => this.views.getSourcesByName(name).length,
    );
  }

  private onSceneItemRemovedHandler(sceneItemState: ISceneItem) {
    // remove source if it has been removed from the all scenes
    const source = this.views.getSource(sceneItemState.sourceId);
    if (!source) return;

    if (source.type === 'scene') return;

    if (this.scenesService.getSourceItemCount(source.sourceId) > 0) return;
    this.removeSource(source.sourceId);
  }

  private getObsSourceCreateSettings(type: TSourceType, settings: Dictionary<any>) {
    const resolvedSettings = cloneDeep(settings);

    // setup default settings
    if (type === 'browser_source') {
      if (resolvedSettings.shutdown === void 0) resolvedSettings.shutdown = true;
      if (resolvedSettings.url === void 0) {
        resolvedSettings.url = 'https://streamlabs.com/browser-source';
      }
    }

    if (type === 'text_gdiplus' && resolvedSettings.text === void 0) {
      resolvedSettings.text = name;
    }

    if (
      type === 'dshow_input' &&
      resolvedSettings.video_device_id === void 0 &&
      this.defaultHardwareService.state.defaultVideoDevice
    ) {
      resolvedSettings.video_device_id = this.defaultHardwareService.state.defaultVideoDevice;
    }

    // TODO: Specifically for TikTok, we don't use auto mode on game capture
    // for portrait resolutions, because auto mode will distort the game.
    // We should remove this change when the backend team makes a change on their
    // end to better scale the game capture in auto mode.
    if (type === 'game_capture' && this.videoService.baseHeight > this.videoService.baseWidth) {
      resolvedSettings.capture_mode = 'any_fullscreen';
    }

    return resolvedSettings;
  }

  getAvailableSourcesTypesList(): IObsListOption<TSourceType>[] {
    const obsAvailableTypes = obs.InputFactory.types();
    const allowlistedTypes: IObsListOption<TSourceType>[] = [
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
      { description: 'Blackmagic Device', value: 'decklink-input' },
      { description: 'NDI Source', value: 'ndi_source' },
      { description: 'OpenVR Capture', value: 'openvr_capture' },
      { description: 'Screen Capture', value: 'screen_capture' },
      { description: 'LIV Client Capture', value: 'liv_capture' },
      { description: 'OvrStream', value: 'ovrstream_dc_source' },
      { description: 'VLC Source', value: 'vlc_source' },
      { description: 'Audio Input Capture', value: 'coreaudio_input_capture' },
      { description: 'Audio Output Capture', value: 'coreaudio_output_capture' },
      { description: 'Video Capture Device', value: 'av_capture_input' },
      { description: 'Display Capture', value: 'display_capture' },
      { description: 'Soundtrack source', value: 'soundtrack_source' },
    ];

    const availableAllowlistedTypes = allowlistedTypes.filter(type =>
      obsAvailableTypes.includes(type.value),
    );
    // 'scene' is not an obs input type so we have to set it manually
    availableAllowlistedTypes.push({ description: 'Scene', value: 'scene' });

    return availableAllowlistedTypes;
  }

  getAvailableSourcesTypes(): TSourceType[] {
    return this.getAvailableSourcesTypesList().map(listItem => listItem.value);
  }

  private handleSourceCallback(objs: IObsSourceCallbackInfo[]) {
    objs.forEach(info => {
      const source = this.views.getSource(info.name);

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

    if (source.audio !== audio || source.video !== video) {
      this.UPDATE_SOURCE({ audio, video, async, doNotDuplicate, id: source.sourceId });

      if (!doNotEmit) this.sourceUpdated.next(source);
    }
  }

  setMuted(id: string, muted: boolean) {
    const source = this.views.getSource(id);
    if (!source) return;
    source.getObsInput().muted = muted;
    this.UPDATE_SOURCE({ id, muted });
    this.sourceUpdated.next(source.state);
  }

  reset() {
    this.RESET_SOURCES();
  }

  /**
   * DO NOT CALL THIS FUNCTION
   * This is a plumbing function that allows properties managers to sync their
   * settings into the Vuex store. It should not be called from anywhere outside
   * the base PropertiesManager class.
   */
  updatePropertiesManagerSettingsInStore(sourceId: string, settings: Dictionary<any>) {
    this.UPDATE_SOURCE({ id: sourceId, propertiesManagerSettings: settings });
  }

  showSourceProperties(sourceId: string) {
    const source = this.views.getSource(sourceId);
    if (!source) return;

    if (source.type === 'screen_capture') return this.showScreenCaptureProperties(source);

    const propertiesManagerType = source.getPropertiesManagerType();

    if (propertiesManagerType === 'widget') return this.showWidgetProperties(source);
    if (propertiesManagerType === 'platformApp') return this.showPlatformAppPage(source);
    if (propertiesManagerType === 'iconLibrary') return this.showIconLibrarySettings(source);

    let propertiesName = SourceDisplayData()[source.type].name;
    if (propertiesManagerType === 'replay') propertiesName = $t('Instant Replay');
    if (propertiesManagerType === 'streamlabels') propertiesName = $t('Stream Label');

    // uncomment the source type to use it's React version
    const reactSourceProps: TSourceType[] = [
      // 'image_source',
      // 'color_source',
      // 'browser_source',
      // 'slideshow',
      // 'ffmpeg_source',
      // 'text_gdiplus',
      // 'text_ft2_source',
      // 'monitor_capture',
      // 'window_capture',
      // 'game_capture',
      // 'dshow_input',
      // 'wasapi_input_capture',
      // 'wasapi_output_capture',
      // 'decklink-input',
      // 'scene',
      // 'ndi_source',
      // 'openvr_capture',
      // 'screen_capture',
      // 'liv_capture',
      // 'ovrstream_dc_source',
      // 'vlc_source',
      // 'coreaudio_input_capture',
      // 'coreaudio_output_capture',
      // 'av_capture_input',
      // 'display_capture',
      // 'audio_line',
      // 'syphon-input',
      // 'soundtrack_source',
    ];

    const componentName =
      reactSourceProps.includes(source.type) && propertiesManagerType === 'default'
        ? 'SourceProperties'
        : 'SourcePropertiesDeprecated';

    this.windowsService.showWindow({
      componentName,
      title: $t('Settings for %{sourceName}', { sourceName: propertiesName }),
      queryParams: { sourceId },
      size: {
        width: 600,
        height: 800,
      },
    });
  }

  showWidgetProperties(source: Source) {
    if (!this.userService.isLoggedIn) return;
    const platform = this.userService.views.platform;
    assertIsDefined(platform);
    const widgetType = source.getPropertiesManagerSettings().widgetType;
    const componentName = this.widgetsService.getWidgetComponent(widgetType);

    // React widgets are in the WidgetsWindow component
    let reactWidgets = [
      'AlertBox',
      // TODO:
      // BitGoal
      // DonationGoal
      // CharityGoal
      // FollowerGoal
      // StarsGoal
      // SubGoal
      // SubscriberGoal
      // ChatBox
      // ChatHighlight
      // Credits
      // DonationTicker
      // EmoteWall
      // EventList
      // MediaShare
      // Poll
      // SpinWheel
      // SponsorBanner
      // StreamBoss
      // TipJar
      'ViewerCount',
    ];
    const isLegacyAlertbox = this.customizationService.state.legacyAlertbox;
    if (isLegacyAlertbox) reactWidgets = reactWidgets.filter(w => w !== 'AlertBox');
    const isReactComponent =
      this.incrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.reactWidgets) &&
      reactWidgets.includes(componentName);
    const windowComponentName = isReactComponent ? 'WidgetWindow' : componentName;

    const defaultVueWindowSize = { width: 920, height: 1024 };
    const defaultReactWindowSize = { width: 600, height: 800 };
    const widgetInfo = this.widgetsService.widgetsConfig[componentName];
    const { width, height } = isReactComponent
      ? widgetInfo.settingsWindowSize || defaultReactWindowSize
      : defaultVueWindowSize;

    if (componentName) {
      this.windowsService.showWindow({
        componentName: windowComponentName,
        title: $t('Settings for %{sourceName}', {
          sourceName: WidgetDisplayData(platform.type)[widgetType].name,
        }),
        queryParams: { sourceId: source.sourceId, widgetType: WidgetType[widgetType] },
        size: {
          width,
          height,
        },
      });
    }
  }

  showPlatformAppPage(source: Source) {
    const settings = source.getPropertiesManagerSettings();
    const app = this.platformAppsService.views.getApp(settings.appId);

    if (app) {
      const page = app.manifest.sources.find(appSource => {
        return appSource.id === settings.appSourceId;
      });

      if (page && page.redirectPropertiesToTopNavSlot) {
        this.navigationService.navigate('PlatformAppMainPage', {
          appId: app.id,
          sourceId: source.sourceId,
        });

        // If we navigated, we don't want to open source properties,
        // and should close any open child windows instead
        this.windowsService.closeChildWindow();
        return;
      }
    }
    this.windowsService.showWindow({
      componentName: 'SourcePropertiesDeprecated',
      title: $t('Settings for %{sourceName}', {
        sourceName: SourceDisplayData()[source.type].name,
      }),
      queryParams: { sourceId: source.sourceId },
      size: {
        width: 600,
        height: 800,
      },
    });
  }

  showIconLibrarySettings(source: Source) {
    const propertiesName = SourceDisplayData()[source.type].name;
    this.windowsService.showWindow({
      componentName: 'IconLibraryProperties',
      title: $t('Settings for %{sourceName}', { sourceName: propertiesName }),
      queryParams: { sourceId: source.sourceId },
      size: {
        width: 400,
        height: 600,
      },
    });
  }

  showScreenCaptureProperties(source: Source) {
    const propertiesName = SourceDisplayData()[source.type].name;
    this.windowsService.showWindow({
      componentName: 'ScreenCaptureProperties',
      title: $t('Settings for %{sourceName}', { sourceName: propertiesName }),
      queryParams: { sourceId: source.sourceId },
      size: {
        width: 690,
        height: 800,
      },
    });
  }

  showShowcase() {
    this.windowsService.showWindow({
      componentName: 'SourceShowcase',
      title: $t('Add Source'),
      size: {
        width: 900,
        height: 700,
      },
    });
  }

  showAddSource(sourceType: TSourceType, sourceAddOptions?: ISourceAddOptions) {
    this.windowsService.showWindow({
      componentName: 'AddSource',
      title: $t('Add Source'),
      queryParams: { sourceType, sourceAddOptions },
      size: {
        width: 600,
        height: 320,
      },
    });
  }

  showRenameSource(sourceId: string) {
    this.windowsService.showWindow({
      componentName: 'RenameSource',
      title: $t('Rename Source'),
      queryParams: { sourceId },
      size: {
        width: 400,
        height: 250,
      },
    });
  }

  /**
   * Show a window for interacting with a browser source.
   * This function does nothing if the source is not a browser source.
   */
  showInteractWindow(sourceId: string) {
    const source = this.views.getSource(sourceId);
    if (!source) return;

    if (source.type !== 'browser_source') return;

    this.windowsService.showWindow({
      componentName: 'BrowserSourceInteraction',
      queryParams: { sourceId },
      title: $t('Interact: %{sourceName}', { sourceName: source.name }),
      size: {
        width: 800,
        height: 600,
      },
    });
  }
}
