import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { Service } from '../core/service';
import { RealmObject } from '../realm';
import { ObjectSchema } from 'realm';
import {
  IVideoInfo,
  EScaleType,
  EFPSType,
  IVideo,
  VideoFactory,
  Video,
  EVideoFormat,
  EColorSpace,
  ERangeType,
} from '../../../obs-api';
import { DualOutputService } from 'services/dual-output';
import { OutputSettingsService } from 'services/settings/output';
import { Subject } from 'rxjs';

/**
 * Display Types
 *
 * Add display type options by adding the display name to the displays array
 * and the context name to the context name map.
 */
const displays = ['horizontal', 'vertical'] as const;
export type TDisplayType = typeof displays[number];

interface IVideoContextSetting {
  video: IVideoInfo;
  isActive: boolean;
}

export type IVideoInfoValue =
  | number
  | EVideoFormat
  | EColorSpace
  | ERangeType
  | EScaleType
  | EFPSType;

export interface IVideoSettingFormatted {
  baseRes: string;
  outputRes: string;
  scaleType: EScaleType;
  fpsType: EFPSType;
  fpsCom: string;
  fpsNum: number;
  fpsDen: number;
  fpsInt: number;
}

export enum ESettingsVideoProperties {
  'baseRes' = 'Base',
  'outputRes' = 'Output',
  'scaleType' = 'ScaleType',
  'fpsType' = 'FPSType',
  'fpsCom' = 'FPSCommon',
  'fpsNum' = 'FPSNum',
  'fpsDen' = 'FPSDen',
  'fpsInt' = 'FPSInt',
}

const scaleTypeNames = {
  0: 'Disable',
  1: 'Point',
  2: 'Bicubic',
  3: 'Bilinear',
  4: 'Lanczos',
  5: 'Area',
};

const fpsTypeNames = {
  0: 'Common',
  1: 'Integer',
  2: 'Fractional',
};

export function invalidFps(num: number, den: number) {
  return num / den > 1000 || num / den < 1;
}

type TIVideoInfo = <T>(key: keyof IVideoInfo) => T;
type TScaleTypeNames = keyof typeof scaleTypeNames;
type TFpsTypeNames = keyof typeof fpsTypeNames;

interface IVideoContextSetting {
  video: IVideoInfo;
  isActive: boolean;
}
export interface IVideoSettingsState {
  horizontal: IVideoContextSetting;
  vertical: IVideoContextSetting;
}

class VideoInfo extends RealmObject implements IVideoInfo {
  fpsNum: number;
  fpsDen: number;
  baseWidth: number;
  baseHeight: number;
  outputWidth: number;
  outputHeight: number;
  outputFormat: number;
  colorspace: number;
  range: number;
  scaleType: number;
  fpsType: number;

  static schema: ObjectSchema = {
    name: 'VideoInfo',
    embedded: true,
    properties: {
      fpsNum: { type: 'int', default: 30 },
      fpsDen: { type: 'int', default: 1 },
      baseWidth: { type: 'int', default: 1920 },
      baseHeight: { type: 'int', default: 1280 },
      outputWidth: { type: 'int', default: 1920 },
      outputHeight: { type: 'int', default: 1280 },
      outputFormat: { type: 'int', default: EVideoFormat.I420 },
      colorspace: { type: 'int', default: EColorSpace.CS709 },
      range: { type: 'int', default: ERangeType.Full },
      scaleType: { type: 'int', default: EScaleType.Bilinear },
      fpsType: { type: 'int', default: EFPSType.Integer },
    },
  };
}

VideoInfo.register({ persist: true });
class VideoContextSetting extends RealmObject {
  video: VideoInfo;
  isActive: boolean;

  static schema: ObjectSchema = {
    name: 'VideoContextSetting',
    embedded: true,
    properties: {
      video: { type: 'object', objectType: 'VideoInfo', default: {} },
      isActive: { type: 'bool', default: true },
    },
  };
}

VideoContextSetting.register({ persist: true });

export class VideoSettingsState extends RealmObject {
  horizontal: VideoContextSetting;
  vertical: VideoContextSetting;

  static schema: ObjectSchema = {
    name: 'VideoSettingsState',
    properties: {
      horizontal: {
        type: 'object',
        objectType: 'VideoContextSetting',
        default: {},
      },
      vertical: {
        type: 'object',
        objectType: 'VideoContextSetting',
        default: {},
      },
    },
  };

  protected onCreated(): void {
    const verticalResolutions = {
      baseWidth: 720,
      baseHeight: 1280,
      outputWidth: 720,
      outputHeight: 1280,
    };

    // load persisted horizontal settings from service
    const data = localStorage.getItem('PersistentStatefulService-DualOutputService');

    if (data) {
      const parsed = JSON.parse(data);

      // horizontal video settings will only exist if the app has been opened after dual output was released
      if (parsed.videoSettings.horizontal) {
        this.db.write(() => {
          this.horizontal.video.deepPatch(parsed.videoSettings.horizontal);
          this.horizontal.isActive = parsed.videoSettings?.activeDisplays?.horizontal ?? true;

          this.vertical.video.deepPatch({
            ...parsed.videoSettings.horizontal,
            ...verticalResolutions,
          });
          this.vertical.isActive = parsed.videoSettings?.activeDisplays?.vertical ?? false;
        });
      }
    } else {
      // always set vertical defaults
      this.db.write(() => {
        this.vertical.video.deepPatch({ ...verticalResolutions });
        this.vertical.isActive = false;
      });
    }
  }

  get values() {
    return {
      horizontal: this.formatVideoValues('horizontal'),
      vertical: this.formatVideoValues('vertical'),
    };
  }

  /**
   * The below provides a default base resolution
   * @remark replaces the legacy base resolution in the video service
   */
  get baseResolution() {
    return this.baseResolutions.horizontal;
  }

  /**
   * The below provides a default base width
   * @remark replaces the legacy base width in the video service
   */
  get baseWidth() {
    return this.baseResolutions.horizontal.baseWidth;
  }

  /**
   * The below provides a default base width
   * @remark replaces the legacy base width in the video service
   */
  get baseHeight() {
    return this.baseResolutions.horizontal.baseHeight;
  }

  /**
   * Get base resolutions for the displays
   * @remark Default values exist to prevent undefined errors on app startup
   */
  get baseResolutions() {
    // to prevent any possible undefined errors on load in the event that the root node
    // attempts to load before the first video context has finished establishing
    // the below are fallback dimensions
    if (!this.horizontal || !this.vertical) {
      console.error('Error loading video settings state. Default base resolution used.');
      return {
        horizontal: {
          baseWidth: 1920,
          baseHeight: 1080,
        },
        vertical: {
          baseWidth: 720,
          baseHeight: 1080,
        },
      };
    }

    const horizontalSettings = this.horizontal?.video;
    const verticalSettings = this.vertical?.video;

    return {
      horizontal: {
        baseWidth: horizontalSettings?.baseWidth,
        baseHeight: horizontalSettings?.baseHeight,
      },
      vertical: {
        baseWidth: verticalSettings?.baseWidth,
        baseHeight: verticalSettings?.baseHeight,
      },
    };
  }

  /**
   * Format video settings for the video settings form
   *
   * @param display - Optional, the display for the settings
   * @returns Settings formatted for the video settings form
   */

  formatVideoValues(display: TDisplayType = 'horizontal', typeStrings?: boolean) {
    const settings = this[display]?.video;

    const scaleType = typeStrings
      ? scaleTypeNames[settings?.scaleType as TScaleTypeNames]
      : settings?.scaleType;
    const fpsType = typeStrings
      ? fpsTypeNames[settings?.fpsType as TFpsTypeNames]
      : settings?.fpsType;

    return {
      baseRes: `${settings?.baseWidth}x${settings?.baseHeight}`,
      outputRes: `${settings?.outputWidth}x${settings?.outputHeight}`,
      scaleType,
      fpsType,
      fpsCom: `${settings?.fpsNum}-${settings?.fpsDen}`,
      fpsNum: settings?.fpsNum,
      fpsDen: settings?.fpsDen,
      fpsInt: settings?.fpsNum,
    };
  }
}

VideoSettingsState.register({ persist: true });
export class VideoSettingsService extends Service {
  @Inject() dualOutputService: DualOutputService;
  @Inject() outputSettingsService: OutputSettingsService;

  state = VideoSettingsState.inject();

  establishedContext = new Subject();
  settingsUpdated = new Subject();

  init() {
    this.establishVideoContext();

    if (this.state.vertical?.isActive && !this.contexts.vertical) {
      this.establishVideoContext('vertical');
    }

    this.establishedContext.next();
  }

  contexts = {
    horizontal: null as IVideo,
    vertical: null as IVideo,
  };

  get values() {
    return {
      horizontal: this.formatVideoValues('horizontal'),
      vertical: this.formatVideoValues('vertical'),
    };
  }

  /**
   * The below provides a default base resolution
   * @remark replaces the legacy base resolution in the video service
   */
  get baseResolution() {
    return this.baseResolutions.horizontal;
  }

  /**
   * The below provides a default base width
   * @remark replaces the legacy base width in the video service
   */
  get baseWidth() {
    return this.baseResolutions.horizontal.baseWidth;
  }

  /**
   * The below provides a default base width
   * @remark replaces the legacy base width in the video service
   */
  get baseHeight() {
    return this.baseResolutions.horizontal.baseHeight;
  }

  /**
   * The below conditionals are to prevent undefined errors on app startup
   */
  get baseResolutions() {
    // to prevent any possible undefined errors on load in the event that the root node
    // attempts to load before the first video context has finished establishing
    // the below are fallback dimensions
    if (!this.state) {
      console.error('Error loading video settings state. Default base resolution used.');
      return {
        horizontal: {
          baseWidth: 1920,
          baseHeight: 1080,
        },
        vertical: {
          baseWidth: 720,
          baseHeight: 1080,
        },
      };
    }

    const horizontalSettings = this.state.horizontal?.video;
    const verticalSettings = this.state.vertical?.video;

    return {
      horizontal: {
        baseWidth: horizontalSettings?.baseWidth,
        baseHeight: horizontalSettings?.baseHeight,
      },
      vertical: {
        baseWidth: verticalSettings?.baseWidth,
        baseHeight: verticalSettings?.baseHeight,
      },
    };
  }

  get outputResolutions() {
    return {
      horizontal: {
        outputWidth: this.state.horizontal?.video.outputWidth,
        outputHeight: this.state.horizontal?.video.outputHeight,
      },
      vertical: {
        outputWidth: this.state.vertical?.video.outputWidth,
        outputHeight: this.state.vertical?.video.outputHeight,
      },
    };
  }

  get videoInfo() {
    return {
      horizontal: this.formatVideoInfo('horizontal'),
      vertical: this.formatVideoInfo('vertical'),
    };
  }

  validateContext(display: TDisplayType, condition?: boolean) {
    if (!this.contexts[display] && !condition) {
      this.establishVideoContext(display);
    }
  }

  getContext(display?: TDisplayType) {
    return this.contexts[display] as IVideo;
  }

  /**
   * Format video settings for the video settings form
   *
   * @param display - Optional, the display for the settings
   * @returns Settings formatted for the video settings form
   */

  formatVideoValues(display: TDisplayType = 'horizontal', typeStrings?: boolean) {
    const settings = this.videoInfo[display];
    const scaleType = typeStrings ? scaleTypeNames[settings?.scaleType] : settings?.scaleType;
    const fpsType = typeStrings ? fpsTypeNames[settings?.fpsType] : settings?.fpsType;

    return {
      baseRes: `${settings?.baseWidth}x${settings?.baseHeight}`,
      outputRes: `${settings?.outputWidth}x${settings?.outputHeight}`,
      scaleType,
      fpsType,
      fpsCom: `${settings?.fpsNum}-${settings?.fpsDen}`,
      fpsNum: settings?.fpsNum,
      fpsDen: settings?.fpsDen,
      fpsInt: settings?.fpsNum,
    };
  }

  formatVideoInfo(display: TDisplayType): IVideoInfo {
    const settings = {} as IVideoInfo;
    const videoInfo = this.state[display].video.realmModel;
    Object.keys(videoInfo)
      .filter(key => key !== '_id')
      .forEach((key: keyof TIVideoInfo) => {
        settings[key] = videoInfo[key];
      });

    return settings;
  }

  /**
   * Establish the obs video context
   *
   * @remarks
   * Many startup errors in other services will result from a context not being established before
   * the service initiates.
   *
   * @param display - Optional, the context's display name
   */
  establishVideoContext(display: TDisplayType = 'horizontal') {
    if (this.contexts[display]) return;
    this.contexts[display] = VideoFactory.create();
    this.migrateSettings(display);

    // ensure vertical context as the same fps settings as the horizontal context
    if (display === 'vertical') {
      this.syncFPSSettings();
    }

    const settings = { ...this.contexts.horizontal.video };
    // setting the below syncs the settings saved locally to obs default video context
    Video.video = settings;
    Video.legacySettings = settings;

    this.settingsUpdated.next();

    return !!this.contexts[display];
  }

  /**
   * Load legacy video settings from cache.
   *
   * @remarks
   * Ideally, the first time the user opens the app after the settings
    * have migrated to being stored on the front end, load the settings from
    * the legacy settings. Because the legacy settings are just values from basic.ini
    * if the user is starting from a clean cache, there will be no such file.
    * In that case, load from the video property.

    * Additionally, because this service is loaded lazily, calling this function elsewhere
    * before the service has been initiated will call the function twice.
    * To prevent errors, just return if both properties are null because
    * the function will be called again as a part of establishing the context.
   * @param display - Optional, the context's display name
   */

  loadLegacySettings(display: TDisplayType = 'horizontal') {
    const legacySettings = this.contexts[display]?.legacySettings;
    const videoSettings = this.contexts[display]?.video;

    if (!legacySettings && !videoSettings) return;

    if (legacySettings?.baseHeight === 0 || legacySettings?.baseWidth === 0) {
      // return if null for the same reason as above
      if (!videoSettings) return;

      Object.keys(videoSettings).forEach((key: keyof IVideoInfo) => {
        this.setVideoSetting(key, videoSettings[key], display);
        this.dualOutputService.setVideoSetting({ [key]: videoSettings[key] }, display);
      });
    } else {
      // return if null for the same reason as above
      if (!legacySettings) return;
      Object.keys(legacySettings).forEach((key: keyof IVideoInfo) => {
        this.setVideoSetting(key, legacySettings[key], display);
        this.dualOutputService.setVideoSetting({ [key]: legacySettings[key] }, display);
      });
      this.contexts[display].video = this.contexts[display].legacySettings;
    }

    if (invalidFps(this.contexts[display].video.fpsNum, this.contexts[display].video.fpsDen)) {
      this.setVideoSetting('fpsNum', 30, display);
      this.setVideoSetting('fpsDen', 1, display);
    }
  }

  /**
   * Migrate settings from legacy settings or obs
   *
   * @param display - Optional, the context's display name
   */
  migrateSettings(display: TDisplayType = 'horizontal') {
    if (!this.contexts[display] || !this.state[display]) return;

    if (display === 'horizontal') {
      this.loadLegacySettings(display);
    }

    const videoInfo = this.videoInfo[display];

    if (invalidFps(videoInfo.fpsNum, videoInfo.fpsDen)) {
      videoInfo.fpsNum = 30;
      videoInfo.fpsDen = 1;
      this.state.db.write(() => {
        this.state[display].video.fpsNum = 30;
        this.state[display].video.fpsDen = 1;
      });
    }

    Object.keys(videoInfo).forEach((key: keyof TIVideoInfo) => {
      this.contexts[display].video[key] = videoInfo[key];
      this.contexts[display].legacySettings[key] = videoInfo[key];
    });
  }

  @debounce(200)
  updateObsSettings(display: TDisplayType = 'horizontal') {
    if (!this.contexts[display]) return;

    this.contexts[display].video = this.videoInfo[display] as IVideoInfo;
    this.contexts[display].legacySettings = this.videoInfo[display] as IVideoInfo;
  }

  /**
   * Sync FPS settings between contexts
   * @remark - If the fps settings are not the same for both contexts, the output settings
   * is working with mismatched values, which contributes to an issue with speed and duration
   * being out of sync. The other factor in this issue is if the latest obs settings are not
   * loaded into the store. When a context is created, the dual output service syncs the vertical
   * fps settings with the horizontal one. But any time we make a change to the fps settings,
   * we need to apply this change to both contexts to keep them synced.
   * @param - Currently, we must confirm fps settings are synced before start streaming
   */
  syncFPSSettings(display: TDisplayType = 'horizontal') {
    const fpsSettings: (keyof IVideoInfo)[] = ['scaleType', 'fpsType', 'fpsNum', 'fpsDen'];
    const syncToDisplay = display === 'vertical' ? 'horizontal' : 'vertical';
    const newVideoSettings = this.videoInfo[syncToDisplay];
    const oldVideoSettings = this.videoInfo[display];
    const oldVideoSettingsContext = this.contexts[display];

    fpsSettings.forEach((key: keyof IVideoInfo) => {
      const diffStateSetting = newVideoSettings[key] !== oldVideoSettings[key];
      const diffContextSetting =
        this.contexts[display]?.video &&
        (newVideoSettings[key] !== oldVideoSettingsContext.video[key] ||
          newVideoSettings[key] !== oldVideoSettingsContext.legacySettings[key]);

      if (diffStateSetting || diffContextSetting) {
        this.setVideoSetting(key, newVideoSettings[key], display);
      }
    });
  }
  /**
   * Migrate optimized settings to vertical context
   */
  migrateAutoConfigSettings() {
    // load optimized settings onto horizontal context
    const settings =
      this.contexts.horizontal?.legacySettings ??
      this.contexts.horizontal?.video ??
      this.state.horizontal.video;

    const updatedSettings = {
      ...settings,
      baseWidth: this.state.vertical.video.baseWidth,
      baseHeight: this.state.vertical.video.baseHeight,
      outputWidth: this.state.vertical.video.outputWidth,
      outputHeight: this.state.vertical.video.outputHeight,
    };
    // this.updateVideoSettings(updatedSettings, 'vertical');

    if (this.contexts?.vertical) {
      // update the Video settings property to the horizontal context dimensions
      const base = `${settings.baseWidth}x${settings.baseHeight}`;
      const output = `${settings.outputWidth}x${settings.outputHeight}`;
    }
  }

  /**
   * Confirm video setting dimensions in settings
   * @remarks Primarily used with the optimizer to ensure the horizontal context dimensions
   * are the dimensions in the settings
   */
  // confirmVideoSettingDimensions() {
  //   const [baseWidth, baseHeight] = this.settingsService.views.values.Video.Base.split('x');
  //   const [outputWidth, outputHeight] = this.settingsService.views.values.Video.Output.split('x');

  //   if (
  //     Number(baseWidth) !== this.state.horizontal.video.baseWidth ||
  //     Number(baseHeight) !== this.state.horizontal.video.baseHeight
  //   ) {
  //     const base = `${this.state.horizontal.video.baseWidth}x${this.state.horizontal.video.baseHeight}`;
  //     this.settingsService.setSettingValue('Video', 'Base', base);
  //   }

  //   if (
  //     Number(outputWidth) !== this.state.horizontal.video.outputWidth ||
  //     Number(outputHeight) !== this.state.horizontal.video.outputHeight
  //   ) {
  //     const output = `${this.state.horizontal.video.outputWidth}x${this.state.horizontal.video.outputHeight}`;
  //     this.settingsService.setSettingValue('Video', 'Output', output);
  //   }
  // }

  /**
   * Update a multiple video settings
   * @remark Use to reduce calls to obs, which contributes to app bloat
   * @param patch - key/values for video info
   * @param display - context to apply setting
   */
  updateVideoSettings(patch: Partial<IVideoInfo>, display: TDisplayType = 'horizontal') {
    this.setSettings({ video: patch }, display);
  }

  /**
   * Update a single video setting
   * @remark Primarily used for the video settings form
   * @param key - property name of setting
   * @param value - new value for setting
   * @param display - context to apply setting
   */
  setVideoSetting(
    key: keyof IVideoInfo,
    value: IVideoInfoValue,
    display: TDisplayType = 'horizontal',
  ) {
    const setting = { [key]: value };
    this.setSettings({ video: setting }, display);
  }

  /**
   * Set if the context is active
   * @remark Primarily used to
   *  - show and hide the displays in the studio editor
   *  - dictate which displays are streamed, recorded, or have replay buffered.
   * @param isActive - boolean for if the context should be available for the user
   * @param display - display to update
   */
  setIsActive(isActive: boolean, display: TDisplayType = 'horizontal') {
    this.setSettings({ isActive }, display);
  }

  setSettings(settingsPatch: DeepPartial<VideoContextSetting>, display: TDisplayType) {
    this.state.db.write(() => {
      this.state[display].deepPatch(settingsPatch);
    });

    // update video contexts
    this.updateObsSettings(display);

    // refresh v1 settings
    this.settingsUpdated.next();
  }

  toggleActive(status: boolean, display: TDisplayType) {
    this.state.db.write(() => {
      this.state[display].isActive = status;
    });
  }

  /**
   * Shut down the video settings service
   *
   * @remarks
   * Each context must be destroyed when shutting down the app to prevent errors
   */
  shutdown() {
    Object.keys(this.contexts).forEach((display: TDisplayType) => {
      if (this.contexts[display]) {
        // save settings as legacy settings
        this.contexts[display].legacySettings = this.videoInfo[display];

        // destroy context
        this.contexts[display].destroy();
      }
    });
  }
}
