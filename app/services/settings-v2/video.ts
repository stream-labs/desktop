import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';
import { DualOutputService } from 'services/dual-output';
import { ScenesService } from 'services/scenes';
import { SettingsService } from 'services/settings';

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

@InitAfter('ScenesService')
export class VideoSettingsService extends StatefulService<IVideoSetting> {
  @Inject() settingsManagerService: SettingsManagerService;
  @Inject() dualOutputService: DualOutputService;
  @Inject() scenesService: ScenesService;
  @Inject() settingsService: SettingsService;

  initialState = {
    default: null as obs.IVideoInfo,
    horizontal: null as obs.IVideoInfo,
    vertical: null as obs.IVideoInfo,
  };

  init() {
    this.establishVideoContext();
    if (this.settingsManagerService.views.activeDisplays.vertical) {
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

  get defaultBaseResolution() {
    const display = this.settingsManagerService.views.defaultDisplay;
    return {
      width: this.contexts[display].video.baseWidth,
      height: this.contexts[display].video.baseHeight,
    };
  }

  get baseResolutions() {
    const [widthStr, heightStr] = this.settingsService.views.values.Video.Base.split('x');
    const horizontalWidth = parseInt(widthStr, 10);
    const horizontalHeight = parseInt(heightStr, 10);

    const verticalWidth = this.settingsManagerService.views.videoSettings.vertical.baseWidth;
    const verticalHeight = this.settingsManagerService.views.videoSettings.vertical.baseHeight;

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

  get videoContext() {
    return this.contexts.horizontal;
  }

  get hasAdditionalContexts() {
    return !!this.state.horizontal && !!this.state.vertical;
  }

  get videoSettings() {
    return this.settingsManagerService.views.videoSettings;
  }

  getVideoContext(display: TDisplayType) {
    return this.state[display];
  }

  getBaseResolution(display: TDisplayType = 'horizontal') {
    return `${this.state[display].baseWidth}x${this.state[display].baseHeight}`;
  }

  formatVideoSettings(display: TDisplayType = 'horizontal') {
    const settings =
      this.state[display] ?? this.settingsManagerService.views.videoSettings.vertical;

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

  migrateSettings(display?: TDisplayType) {
    if (display === 'horizontal') {
      this.SET_VIDEO_CONTEXT(display, this.contexts[display].video);

      Object.keys(this.contexts.horizontal.legacySettings).forEach((key: keyof obs.IVideo) => {
        this.SET_VIDEO_SETTING(key, this.contexts.horizontal.legacySettings[key]);
      });
      Object.keys(this.contexts.horizontal.video).forEach((key: keyof obs.IVideo) => {
        this.SET_VIDEO_SETTING(key, this.contexts.horizontal.video[key]);
      });
    } else {
      const data = this.settingsManagerService.views.videoSettings.vertical;
      this.SET_VIDEO_CONTEXT(display, this.contexts[display].video);
      Object.keys(data).forEach(
        (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
          this.SET_VIDEO_SETTING(key, data[key], display);
        },
      );
    }

    if (invalidFps(this.contexts[display].video.fpsNum, this.contexts[display].video.fpsDen)) {
      this.createDefaultFps(display);
    }
  }

  establishVideoContext(display: TDisplayType = 'horizontal') {
    if (this.contexts[display]) return;

    this.contexts[display] = obs.VideoFactory.create();
    this.SET_VIDEO_CONTEXT(display);
    this.migrateSettings(display);
    this.contexts[display].video = this.state[display];
    this.contexts[display].legacySettings = this.state[display];

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

  resetToDefaultContext() {
    for (const context in this.contexts) {
      if (context !== 'horizontal') {
        this.destroyVideoContext(context as TDisplayType);
      }
    }
  }

  @debounce(200)
  updateObsSettings(display: TDisplayType = 'horizontal') {
    console.log('this.contexts.horizontal.video ', this.contexts.horizontal.video);
    console.log(
      'this.contexts.horizontal.legacySettings ',
      this.contexts.horizontal.legacySettings,
    );
    console.log('this.state.horizontal ', this.state.horizontal);
    switch (display) {
      case 'horizontal': {
        this.contexts.horizontal.video = this.state.horizontal;
        this.contexts.horizontal.legacySettings = this.state.horizontal;
        break;
      }
      case 'vertical': {
        this.contexts.vertical.video = this.state.vertical;
        this.contexts.vertical.legacySettings = this.state.vertical;
        break;
      }
      default: {
        this.contexts.horizontal.video = this.state.horizontal;
        this.contexts.horizontal.legacySettings = this.state.horizontal;
      }
    }
  }

  setVideoSetting(key: string, value: unknown, display: TDisplayType = 'horizontal') {
    this.SET_VIDEO_SETTING(key, value, display);
    this.updateObsSettings(display);

    if (display === 'vertical') {
      // if the display is vertical, also update the persisted settings
      this.settingsManagerService.setVideoSetting({ [key]: value });
    }
  }

  shutdown() {
    displays.forEach(display => {
      const context = this.contexts[display];
      if (context) {
        context.destroy();
      }
    });
  }

  @mutation()
  DESTROY_VIDEO_CONTEXT(display: TDisplayType = 'horizontal') {
    this.contexts[display] = null as obs.IVideo;
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
