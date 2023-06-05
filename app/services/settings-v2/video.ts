import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { DualOutputService } from 'services/dual-output';
import { SettingsService } from 'services/settings';
import { Subject } from 'rxjs';

/**
 * Display Types
 *
 * Add display type options by adding the display name to the displays array
 * and the context name to the context name map.
 */
const displays = ['default', 'horizontal', 'vertical'] as const;
export type TDisplayType = typeof displays[number];

export interface IVideoSetting {
  default: obs.IVideoInfo;
  horizontal: obs.IVideoInfo;
  vertical: obs.IVideoInfo;
}

export interface IVideoSettingFormatted {
  baseRes: string;
  outputRes: string;
  scaleType: obs.EScaleType;
  fpsType: obs.EFPSType;
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
export function invalidFps(num: number, den: number) {
  return num / den > 1000 || num / den < 1;
}

export class VideoSettingsService extends StatefulService<IVideoSetting> {
  @Inject() dualOutputService: DualOutputService;
  @Inject() settingsService: SettingsService;

  initialState = {
    default: null as obs.IVideoInfo,
    horizontal: null as obs.IVideoInfo,
    vertical: null as obs.IVideoInfo,
  };

  establishedContext = new Subject();

  init() {
    this.establishVideoContext();

    if (this.dualOutputService.views.activeDisplays.vertical) {
      this.establishVideoContext('vertical');
    }

    this.establishedContext.next();
  }

  contexts = {
    default: null as obs.IVideo,
    horizontal: null as obs.IVideo,
    vertical: null as obs.IVideo,
  };

  get values() {
    return {
      horizontal: this.formatVideoSettings('horizontal'),
      vertical: this.formatVideoSettings('vertical'),
    };
  }

  get hasContext() {
    return this.contexts.horizontal !== null;
  }

  get baseResolutions() {
    const videoSettings = this.dualOutputService.views.videoSettings;
    const [widthStr, heightStr] = this.settingsService.views.values.Video.Base.split('x');
    const defaultWidth = parseInt(widthStr, 10);
    const defaultHeight = parseInt(heightStr, 10);

    const horizontalWidth = videoSettings.horizontal
      ? videoSettings.horizontal?.baseWidth
      : defaultWidth;
    const horizontalHeight = videoSettings.horizontal
      ? videoSettings.horizontal?.baseHeight
      : defaultHeight;

    const verticalWidth = videoSettings.vertical.baseWidth ?? defaultWidth;
    const verticalHeight = videoSettings.vertical.baseHeight ?? defaultHeight;

    return {
      horizontal: {
        baseWidth: horizontalWidth ?? this.contexts.horizontal?.video.baseWidth,
        baseHeight: horizontalHeight ?? this.contexts.horizontal?.video.baseHeight,
      },
      vertical: {
        baseWidth: verticalWidth ?? this.contexts.vertical?.video.baseWidth,
        baseHeight: verticalHeight ?? this.contexts.vertical?.video.baseHeight,
      },
    };
  }

  formatVideoSettings(display: TDisplayType = 'horizontal') {
    const settings = this.state[display] ?? this.dualOutputService.views.videoSettings.vertical;

    return {
      baseRes: `${settings?.baseWidth}x${settings?.baseHeight}`,
      outputRes: `${settings?.outputWidth}x${settings?.outputHeight}`,
      scaleType: settings?.scaleType,
      fpsType: settings?.fpsType,
      fpsCom: `${settings?.fpsNum}-${settings?.fpsDen}`,
      fpsNum: settings?.fpsNum,
      fpsDen: settings?.fpsDen,
      fpsInt: settings?.fpsNum,
    };
  }

  loadLegacySettings(display: TDisplayType = 'horizontal') {
    const videoLegacy = this.contexts[display].legacySettings;
    Object.keys(videoLegacy).forEach((key: keyof obs.IVideoInfo) => {
      // on first login, the base width and height of legacy settings is zero
      // so if that is the case, try to use the settings from the video property
      if (
        ['baseWidth', 'baseHeight'].includes(key) &&
        videoLegacy[key] === 0 &&
        !!this.contexts[display]?.video
      ) {
        const video = this.contexts[display]?.video;
        this.SET_VIDEO_SETTING(key, video[key]);
        this.dualOutputService.setVideoSetting({ [key]: video[key] }, 'horizontal');
      } else {
        this.SET_VIDEO_SETTING(key, videoLegacy[key]);
        this.dualOutputService.setVideoSetting({ [key]: videoLegacy[key] }, 'horizontal');
      }
    });
  }

  migrateSettings(display: TDisplayType = 'horizontal') {
    // if this is the first time starting the app
    // set default settings for horizontal context
    if (display === 'horizontal' && !this.dualOutputService.views.videoSettings.horizontal) {
      this.loadLegacySettings(display);
    } else {
      // otherwise, load them from the dual output service
      const settings = this.dualOutputService.views.videoSettings[display];

      Object.keys(settings).forEach((key: keyof obs.IVideoInfo) => {
        this.SET_VIDEO_SETTING(key, settings[key], display);
      });
      this.contexts[display].video = settings;
    }

    if (invalidFps(this.contexts[display].video.fpsNum, this.contexts[display].video.fpsDen)) {
      this.createDefaultFps(display);
    }

    this.SET_VIDEO_CONTEXT(display, this.contexts[display].video);
  }

  establishVideoContext(display: TDisplayType = 'horizontal') {
    if (this.contexts[display]) return;
    this.SET_VIDEO_CONTEXT(display);
    this.contexts[display] = obs.VideoFactory.create();
    this.migrateSettings(display);

    this.contexts[display].video = this.state[display];
    this.contexts[display].legacySettings = this.state[display];
    obs.Video.video = this.state.horizontal;
    obs.Video.legacySettings = this.state.horizontal;

    return !!this.contexts[display];
  }

  destroyVideoContext(display: TDisplayType = 'horizontal') {
    if (this.contexts[display]) {
      const context: obs.IVideo = this.contexts[display];
      context.destroy();
    }

    this.contexts[display] = null as obs.IVideo;
    this.REMOVE_CONTEXT(display);

    return !!this.contexts[display];
  }

  createDefaultFps(display: TDisplayType = 'horizontal') {
    this.setVideoSetting('fpsNum', 30, display);
    this.setVideoSetting('fpsDen', 1, display);
  }

  @debounce(200)
  updateObsSettings(display: TDisplayType = 'horizontal') {
    this.contexts[display].video = this.state[display];
    this.contexts[display].legacySettings = this.state[display];
  }

  setVideoSetting(key: string, value: unknown, display: TDisplayType = 'horizontal') {
    this.SET_VIDEO_SETTING(key, value, display);
    this.updateObsSettings(display);

    // also update the persisted settings
    this.dualOutputService.setVideoSetting({ [key]: value }, display);
  }

  shutdown() {
    displays.forEach(display => {
      if (this.contexts[display]) {
        // save settings as legacy settings
        this.contexts[display].legacySettings = this.state[display];

        // destroy context
        this.contexts[display].destroy();
        this.contexts[display] = null as obs.IVideo;
        this.DESTROY_VIDEO_CONTEXT(display);
      }
    });
  }

  @mutation()
  DESTROY_VIDEO_CONTEXT(display: TDisplayType = 'horizontal') {
    this.state[display] = null as obs.IVideoInfo;
  }

  @mutation()
  SET_VIDEO_SETTING(key: string, value: unknown, display: TDisplayType = 'horizontal') {
    this.state[display] = {
      ...this.state[display],
      [key]: value,
    };
  }

  @mutation()
  SET_VIDEO_CONTEXT(display: TDisplayType = 'horizontal', settings?: obs.IVideoInfo) {
    if (settings) {
      this.state[display] = settings;
    } else {
      this.state[display] = {} as obs.IVideoInfo;
    }
  }

  @mutation()
  REMOVE_CONTEXT(display: TDisplayType) {
    this.state[display] = null as obs.IVideoInfo;
  }
}
