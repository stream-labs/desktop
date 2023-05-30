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
    this.establishedContext.next();
    if (this.dualOutputService.views.activeDisplays.vertical) {
      this.establishVideoContext('vertical');
    }
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
        baseWidth: this.contexts.horizontal?.video.baseWidth ?? horizontalWidth,
        baseHeight: this.contexts.horizontal?.video.baseHeight ?? horizontalHeight,
      },
      vertical: {
        baseWidth: this.contexts.vertical?.video.baseWidth ?? verticalWidth,
        baseHeight: this.contexts.vertical?.video.baseHeight ?? verticalHeight,
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

  migrateSettings(display: TDisplayType = 'horizontal') {
    // if this is the first time starting the app
    // set default settings for horizontal context
    const videoLegacy = this.contexts.horizontal.legacySettings;

    if (display === 'horizontal' && !this.dualOutputService.views.videoSettings.horizontal) {
      Object.keys(videoLegacy).forEach((key: keyof obs.IVideoInfo) => {
        this.SET_VIDEO_SETTING(key, videoLegacy[key]);
        this.dualOutputService.setVideoSetting({ [key]: videoLegacy[key] }, 'horizontal');
      });
    } else {
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
