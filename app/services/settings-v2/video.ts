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
import { SettingsService } from 'services/settings';
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

class VideoInfo extends RealmObject implements IVideoInfo {
  fpsNum: number;
  fpsDen: number;
  baseWidth: number;
  baseHeight: number;
  outputWidth: number;
  outputHeight: number;
  outputFormat: EVideoFormat;
  colorspace: EColorSpace;
  range: ERangeType;
  scaleType: EScaleType;
  fpsType: EFPSType;

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
      outputFormat: { type: 'string', default: EVideoFormat.I420 },
      colorspace: { type: 'string', default: EColorSpace.CS709 },
      range: { type: 'string', default: ERangeType.Full },
      scaleType: { type: 'string', default: EScaleType.Bilinear },
      fpsType: { type: 'string', default: EFPSType.Integer },
    },
  };
}

VideoInfo.register({ persist: true });

// class VideoContext extends RealmObject {
//   video: VideoInfo;
//   legacySettings: VideoInfo;
//   // destroy(): void;
//   /**
//    * Number of total skipped frames
//    */
//   readonly skippedFrames: number;

//   /**
//    * Number of total encoded frames
//    */
//   readonly encodedFrames: number;

//   static schema: ObjectSchema = {
//     name: 'VideoContext',
//     embedded: true,
//     properties: {
//       video: { type: 'object', objectType: 'VideoInfo' },
//       legacySettings: { type: 'object', objectType: 'VideoInfo' },
//       skippedFrames: { type: 'int' },
//       encodedFrames: { type: 'int' },
//     },
//   };
// }
// VideoContext.register({ persist: true });

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

class VideoSettingsState extends RealmObject {
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
    //   console.log('Video', JSON.stringify(Video, null, 2));
    //   console.log('this', JSON.stringify(this, null, 2));

    // Migrating video settings is complicated because the method of storage has gone through many iterations.
    // Attempt migration in reverse order of these changes. Default values have already been set to prevent errors.

    // // 1. Dual Output Service - Horizontal & Vertical
    const data = localStorage.getItem('PersistentStatefulService-DualOutputService');

    if (data) {
      const parsed = JSON.parse(data);
      console.log('parsed', JSON.stringify(parsed, null, 2));

      //   // horizontal video settings will only exist if the app has been opened after dual output was released
      //   if (parsed.videoSettings.horizontal) {
      //     const settings = {
      //       horizontal: this.formatVideoContextSettings(parsed.videoSettings.horizontal, true),
      //       vertical: this.formatVideoContextSettings(parsed.videoSettings.horizontal),
      //     };

      //     this.db.write(() => {
      //       this.horizontal.video.deepPatch(settings.horizontal.video);
      //       this.horizontal.isActive = settings.horizontal.isActive;

      //       const verticalSettings = {
      //         ...settings.horizontal.video,
      //       };
      //       verticalSettings.baseWidth = 720;
      //       verticalSettings.baseHeight = 720;

      //       this.vertical.video.deepPatch(verticalSettings);
      //       this.vertical.isActive = false;
      //     });
      //   }
    }

    // @@@ NOTE: we probably can't do this because the context hasn't been created yet

    // // 2. OSN Legacy Settings - Horizontal Only
    // // Ideally, the first time the user opens the app after the settings have migrated to being stored
    // // on the front end, load the settings from the legacy settings. The legacy settings are
    // // just values from basic.ini
    // if (
    //   Video.legacySettings &&
    //   Video.legacySettings?.baseWidth !== 0 &&
    //   Video.legacySettings?.baseHeight !== 0
    // ) {
    //   settings = {
    //     horizontal: this.formatVideoContextSettings(Video.legacySettings, true),
    //     vertical: this.formatVideoContextSettings(Video.legacySettings),
    //   };
    // }

    // // 3. OSN Video Settings - Horizontal Display Settings Only
    // // Because the legacy settings are just values from basic.ini, if the user is starting from
    // // a clean cache, there will be no such file. In that case, load from the video property.
    // if (Video.video) {
    //   settings = {
    //     horizontal: this.formatVideoContextSettings(Video.video, true),
    //     vertical: this.formatVideoContextSettings(Video.video),
    //   };
    // }

    // console.log('settings', JSON.stringify(settings, null, 2));
    // // only overwrite default values if settings need to be migrated
  }

  private formatVideoContextSettings(videoInfo: IVideoInfo, isActive: boolean = false) {
    const settings = {} as VideoInfo;
    Object.keys(videoInfo).forEach((key: keyof IVideoInfo) => {
      settings[key as string] = videoInfo[key];
    });

    if (invalidFps(settings.fpsNum, settings.fpsDen)) {
      settings.fpsNum = 30;
      settings.fpsDen = 1;
    }

    return {
      video: settings,
      isActive,
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
    console.log('init state', JSON.stringify(this.state.realmModel, null, 2));
    console.log('init contexts', JSON.stringify(this.contexts, null, 2));
    this.establishVideoContext();

    if (this.state?.vertical?.isActive && !this.contexts.vertical) {
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
    const defaultWidth = 1920;
    const defaultHeight = 1080;

    // return {
    //   horizontal: {
    //     baseWidth: defaultWidth,
    //     baseHeight: defaultHeight,
    //   },
    //   vertical: {
    //     baseWidth: defaultWidth,
    //     baseHeight: defaultHeight,
    //   },
    // };

    const horizontalSettings =
      this.contexts.horizontal?.video ??
      this.contexts.horizontal?.legacySettings ??
      this.state?.horizontal?.video;
    const verticalSettings =
      this.contexts.vertical?.video ??
      this.contexts.vertical?.legacySettings ??
      this.state?.vertical?.video;

    return {
      horizontal: {
        baseWidth: horizontalSettings?.baseWidth ?? defaultWidth,
        baseHeight: horizontalSettings?.baseHeight ?? defaultHeight,
      },
      vertical: {
        baseWidth: verticalSettings?.baseWidth ?? defaultWidth,
        baseHeight: verticalSettings?.baseHeight ?? defaultHeight,
      },
    };
  }

  get outputResolutions() {
    return {
      horizontal: {
        outputWidth: this.contexts.horizontal?.video.outputWidth,
        outputHeight: this.contexts.horizontal?.video.outputHeight,
      },
      vertical: {
        outputWidth: this.contexts.vertical?.video.outputWidth,
        outputHeight: this.contexts.vertical?.video.outputHeight,
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
    const settings = this.contexts[display]?.video ?? this.state[display].video;

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
    console.log(`this.contexts[${display}] `, JSON.stringify(this.contexts[display], null, 2));
  }

  /**
   * Migrate settings from legacy settings or obs
   *
   * @param display - Optional, the context's display name
   */
  migrateSettings(display: TDisplayType = 'horizontal') {
    // if (!this.contexts[display] || !this.state[display]) return;
    // const settings = this.state[display].video;
    // this.contexts[display].video = settings;

    // setting the below syncs the settings saved locally to obs default video context
    if (display === 'horizontal') {
      Video.video = this.contexts.horizontal.video;
      Video.legacySettings = this.contexts.horizontal.legacySettings;
      // Video.video = settings;
      // Video.legacySettings = settings;
    }

    this.settingsUpdated.next();
  }

  @debounce(200)
  updateObsSettings(display: TDisplayType = 'horizontal') {
    if (!this.contexts[display]) return;

    this.contexts[display].video = this.state[display].video;
    this.contexts[display].legacySettings = this.state[display].video;
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
    const newVideoSettings = this.contexts[syncToDisplay].video ?? this.state[syncToDisplay].video;
    const oldVideoSettings = this.state[display].video;
    const oldVideoSettingsContext = this.contexts[display];

    fpsSettings.forEach((key: keyof IVideoInfo) => {
      const diffStateSetting = newVideoSettings[key] !== oldVideoSettings[key];
      const diffContextSetting =
        this.contexts[display]?.video &&
        (newVideoSettings[key] !== oldVideoSettingsContext.video[key] ||
          newVideoSettings[key] !== oldVideoSettingsContext.legacySettings[key]);

      if (diffStateSetting || diffContextSetting) {
        // set realm
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
    this.updateVideoSettings(updatedSettings, 'vertical');

    if (this.contexts?.vertical) {
      // update the Video settings property to the horizontal context dimensions
      const base = `${settings.baseWidth}x${settings.baseHeight}`;
      const output = `${settings.outputWidth}x${settings.outputHeight}`;
      // this.settingsService.setSettingValue('Video', 'Base', base);
      // this.settingsService.setSettingValue('Video', 'Output', output);
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
   * Shut down the video settings service
   *
   * @remarks
   * Each context must be destroyed when shutting down the app to prevent errors
   */
  shutdown() {
    console.log('this.contexts', JSON.stringify(this.contexts, null, 2));
    Object.keys(this.contexts).forEach((display: TDisplayType) => {
      if (this.contexts[display]) {
        // save settings as legacy settings
        this.contexts[display].legacySettings = this.state[display].video;

        // destroy context
        this.contexts[display].destroy();
      }
    });
  }

  updateVideoSettings(patch: Partial<IVideoInfo>, display: TDisplayType = 'horizontal') {
    const settings: IVideoInfo = this.contexts[display].video ?? this.state[display].video;
    const video = { ...settings, ...patch };

    this.setSettings({ [display]: video });

    // this.SET_VIDEO_CONTEXT(display, newVideoSettings);
    this.updateObsSettings(display);
    // refresh v1 settings
    this.settingsUpdated.next();
  }

  setVideoSetting(
    key: keyof IVideoInfo,
    value: IVideoInfoValue,
    display: TDisplayType = 'horizontal',
  ) {
    const setting = { [key]: value };
    this.setSettings({ [display]: { video: { setting } } });
  }

  setSettings(
    settingsPatch: DeepPartial<VideoSettingsState>,
    display: TDisplayType = 'horizontal',
  ) {
    this.state.db.write(() => {
      this.state.deepPatch(settingsPatch);
    });
    this.updateObsSettings(display);

    // refresh v1 settings
    this.settingsUpdated.next();
  }

  /**
   * Set if the context is active
   * @remark Primarily used to
   *  - show and hide the displays in the studio editor
   *  - dictate which displays are streamed, recorded, or have replay buffered.
   * @param isActive - boolean for if the context should be available for the user
   * @param display - display to update
   */
  setIsActive(isActive: boolean, display: TDisplayType) {
    this.setSettings({ [display]: isActive });
  }
}
