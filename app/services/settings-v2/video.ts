import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';
import { DualOutputService } from 'services/dual-output';
import { ScenesService } from 'services/scenes';

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

@InitAfter('SettingsManagerService')
export class VideoSettingsService extends StatefulService<IVideoSetting> {
  @Inject() settingsManagerService: SettingsManagerService;
  @Inject() dualOutputService: DualOutputService;
  @Inject() scenesService: ScenesService;

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

  get values() {
    return {
      horizontal: this.horizontalSettingsValues,
      vertical: this.verticalSettingsValues,
    };
  }

  contexts = {
    default: null as obs.IVideo,
    horizontal: null as obs.IVideo,
    vertical: null as obs.IVideo,
  };

  get horizontalSettingsValues() {
    return this.formatVideoSettings('horizontal');
  }

  get verticalSettingsValues() {
    return this.formatVideoSettings('vertical');
  }

  get defaultBaseResolution() {
    return {
      width: this.contexts.horizontal.video.baseWidth,
      height: this.contexts.horizontal.video.baseHeight,
    };
  }

  get videoContext() {
    return this.contexts.horizontal;
  }

  get hasAdditionalContexts() {
    return !!this.state.horizontal && !!this.state.vertical;
  }

  get videoSettings() {
    console.log(
      'this.settingsManagerService.views.videoSettings ',
      this.settingsManagerService.views.videoSettings,
    );
    return this.settingsManagerService.views.videoSettings;
  }

  getVideoContext(display: TDisplayType) {
    return this.state[display];
  }

  getBaseResolution(display: TDisplayType = 'horizontal') {
    return `${this.state[display].baseWidth}x${this.state[display].baseHeight}`;
  }

  formatVideoSettings(display: TDisplayType = 'horizontal') {
    let settings;
    if (display === 'horizontal') {
      settings = this.state[display];
    } else {
      settings = this.settingsManagerService.views.videoSettings.vertical;
    }

    return {
      baseRes: `${settings.baseWidth}x${settings.baseHeight}`,
      outputRes: `${settings.outputWidth}x${settings.outputHeight}`,
      scaleType: settings.scaleType,
      fpsType: settings.fpsType,
      fpsCom: `${settings.fpsNum}-${settings.fpsDen}`,
      fpsNum: settings.fpsNum,
      fpsDen: settings.fpsDen,
      fpsInt: settings.fpsNum,
    };
  }

  migrateSettings(display?: TDisplayType) {
    // @@@ TODO: Refactor to remove use of horizontal and vertical dummy data when persistence is implemented

    // @@@ TODO: Confirm the below works with AutoConfig Service
    // if (!display) {
    //   displays.forEach(display => {
    //     // migrate display
    //   });
    // }

    if (display === 'horizontal') {
      // if this the default display is the horizontal display, get the settings from obs
      // @@@ TODO: handle vertical being the default display
      this.state.horizontal = this.contexts.horizontal.video;
      Object.keys(this.contexts.horizontal.legacySettings).forEach(
        (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
          this.SET_VIDEO_SETTING(key, this.contexts.horizontal.legacySettings[key]);
        },
      );
      Object.keys(this.contexts.horizontal.video).forEach((key: keyof obs.IVideo) => {
        this.SET_VIDEO_SETTING(key, this.contexts.horizontal.video[key]);
        if (
          invalidFps(this.contexts.horizontal.video.fpsNum, this.contexts.horizontal.video.fpsDen)
        ) {
          this.createDefaultFps();
        }
      });
    } else {
      // if dual output mode is active, apply settings from the settings manager
      // const data =
      //   display === 'horizontal' ? this.videoSettings.horizontal : this.videoSettings.vertical;
      const data = this.videoSettings.vertical;

      this.state[display] = this.contexts[display].video;
      Object.keys(data).forEach(
        (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
          this.SET_VIDEO_SETTING(key, data[key], display);
          if (
            invalidFps(this.contexts[display].video.fpsNum, this.contexts[display].video.fpsDen)
          ) {
            this.createDefaultFps(display);
          }
        },
      );
    }

    console.log('this.contexts', this.contexts);

    /**
     * @@@ The below is the original code from 01/05 merge master into branch
     *     that was refactored above.
     *     TODO: remove comment once functionality confirmed
     */

    // CURRENT
    // this.state.default = this.state.videoContext.video;
    // Object.keys(this.state.videoContext.legacySettings).forEach(
    //   (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
    //     this.SET_VIDEO_SETTING(key, this.state.videoContext.legacySettings[key]);
    //   },
    // );

    // INCOMING
    // Object.keys(this.videoSettings).forEach((key: keyof obs.IVideo) => {
    //   this.SET_VIDEO_SETTING(key, this.videoSettings[key]);
    // });

    // if (invalidFps(this.state.videoContext.fpsNum, this.state.videoContext.fpsDen)) {
    //   this.setVideoSetting('fpsNum', 30);
    //   this.setVideoSetting('fpsDen', 1);
    // }
  }

  createDefaultFps(display: TDisplayType = 'horizontal') {
    this.setVideoSetting('fpsNum', 30, display);
    this.setVideoSetting('fpsDen', 1, display);
  }

  establishVideoContext(display: TDisplayType = 'horizontal') {
    if (this.contexts[display]) return;

    this.contexts[display] = obs.VideoFactory.create();
    this.state[display] = {} as obs.IVideoInfo;
    this.migrateSettings(display);
    this.contexts[display].video = this.state[display];

    return !!this.contexts[display];
  }

  destroyVideoContext(display: TDisplayType = 'horizontal') {
    if (this.contexts[display]) {
      const context: obs.IVideo = this.contexts[display];
      context.destroy();
    }
    this.DESTROY_VIDEO_CONTEXT(display);

    return !this.contexts[display];
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
    switch (display) {
      case 'horizontal': {
        this.contexts.horizontal.video = this.state.horizontal;
        break;
      }
      case 'vertical': {
        this.contexts.vertical.video = this.state.vertical;
        break;
      }
      default: {
        this.contexts.horizontal.video = this.state.horizontal;
      }
    }
  }

  setVideoSetting(key: string, value: unknown, display: TDisplayType = 'horizontal') {
    this.SET_VIDEO_SETTING(key, value, display);

    if (display === 'horizontal') {
      this.updateObsSettings();
    } else if (display === 'vertical') {
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
}
