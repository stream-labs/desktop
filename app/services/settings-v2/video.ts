import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';
import { DualOutputService } from 'services/dual-output';
import { ScenesService } from 'services/scenes';
import { Subject } from 'rxjs';

// @@@ TODO: Remove dummy data when persistence is implemented
const horizontalData = {
  fpsNum: 120,
  fpsDen: 2,
  baseWidth: 3840,
  baseHeight: 2160,
  outputWidth: 1920,
  outputHeight: 1080,
  outputFormat: obs.EVideoFormat.I420,
  colorspace: obs.EColorSpace.CS709,
  range: obs.ERangeType.Full,
  scaleType: obs.EScaleType.Lanczos,
  fpsType: obs.EFPSType.Fractional,
};

const verticalData = {
  fpsNum: 60,
  fpsDen: 2,
  baseWidth: 400,
  baseHeight: 700,
  outputWidth: 400,
  outputHeight: 700,
  outputFormat: obs.EVideoFormat.I420,
  colorspace: obs.EColorSpace.CS709,
  range: obs.ERangeType.Full,
  scaleType: obs.EScaleType.Lanczos,
  fpsType: obs.EFPSType.Fractional,
};
// ^^^

/**
 * Display Types
 *
 * Add display type options by adding the display name to the displays array
 * and the context name to the context name map.
 */
const displays = ['default', 'horizontal', 'vertical'] as const;
export type TDisplayType = typeof displays[number];

const contextNameMap: Record<TDisplayType, string> = {
  default: 'videoContext',
  horizontal: 'horizontalContext',
  vertical: 'verticalContext',
};

interface IVideoSettings {
  videoContext: obs.IVideo;
  horizontalContext: obs.IVideo;
  verticalContext: obs.IVideo;
  default: obs.IVideoInfo;
  horizontal: obs.IVideoInfo;
  vertical: obs.IVideoInfo;
  // outputIdMap: { [key: string]: number } // @@@ TODO: map outputId to context when created. Key is context name
}

export interface IVideoSettingsFormatted {
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

@InitAfter('UserService')
export class VideoSettingsService extends StatefulService<IVideoSettings> {
  @Inject() settingsManagerService: SettingsManagerService;
  @Inject() dualOutputService: DualOutputService;
  @Inject() scenesService: ScenesService;

  initialState = {
    videoContext: null as obs.IVideo,
    horizontalContext: null as obs.IVideo,
    verticalContext: null as obs.IVideo,
    default: null as obs.IVideoInfo,
    horizontal: null as obs.IVideoInfo,
    vertical: null as obs.IVideoInfo,
  };

  init() {
    this.establishVideoContext();
  }

  get values() {
    return {
      default: this.videoSettingsValues,
      horizontal: this.horizontalSettingsValues,
      vertical: this.verticalSettingsValues,
    };
  }

  get contexts() {
    return {
      default: this.state.videoContext,
      horizontal: this.state.horizontalContext,
      vertical: this.state.verticalContext,
    };
  }

  get dualOutputSettings() {
    return {
      horizontal: this.formatDualOutputSettings('horizontal'),
      vertical: this.formatDualOutputSettings('vertical'),
    };
  }

  get videoSettingsValues() {
    return this.formatVideoSettings('default');
  }

  get horizontalSettingsValues() {
    return this.formatVideoSettings('horizontal');
  }

  get verticalSettingsValues() {
    return this.formatVideoSettings('vertical');
  }

  get defaultBaseResolution() {
    return {
      width: this.videoContext.video.baseWidth,
      height: this.videoContext.video.baseHeight,
    };
  }

  get videoContext() {
    return this.state.videoContext;
  }

  get hasAdditionalContexts() {
    return !!this.state.horizontalContext && !!this.state.verticalContext;
  }

  // @@@ TODO: Refactor for persistence
  // get videoSettings() {
  //   return this.settingsManagerService.videoSettings;
  // }

  getVideoContext(display: TDisplayType) {
    const contextName = contextNameMap[display];
    return this.state[contextName];
  }

  getBaseResolution(display: TDisplayType = 'default') {
    return `${this.state[display].baseWidth}x${this.state[display].baseHeight}`;
  }

  formatVideoSettings(display: TDisplayType = 'default') {
    const settings = this.state[display];

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

  formatDualOutputSettings(display: TDisplayType) {
    const settings = this.state[display];

    if (settings) {
      return {
        Base: `${settings.baseWidth}x${settings.baseHeight}`,
        Output: `${settings.outputWidth}x${settings.outputHeight}`,
        ScaleType: settings.scaleType,
        FPSType: settings.fpsType,
        FPSCommon: `${settings.fpsNum}-${settings.fpsDen}`,
        FPSNum: settings.fpsNum,
        FPSDen: settings.fpsDen,
        FPSInt: settings.fpsNum,
      };
    } else {
      return {
        Base: `${this.state.default.baseWidth}x${this.state.default.baseHeight}`,
        Output: `${this.state.default.outputWidth}x${this.state.default.outputHeight}`,
        ScaleType: this.state.default.scaleType,
        FPSType: this.state.default.fpsType,
        FPSCommon: `${this.state.default.fpsNum}-${this.state.default.fpsDen}`,
        FPSNum: this.state.default.fpsNum,
        FPSDen: this.state.default.fpsDen,
        FPSInt: this.state.default.fpsNum,
      };
    }
  }

  migrateSettings(display?: TDisplayType) {
    // @@@ TODO: Refactor to remove use of horizontal and vertical dummy data when persistence is implemented

    // @@@ TODO: Confirm the below works with AutoConfig Service
    // if (!display) {
    //   displays.forEach(display => {
    //     // migrate display
    //   });
    // }

    const contextName = contextNameMap[display];

    if (display === 'default') {
      this.state.default = this.state.videoContext.video;
      Object.keys(this.state.videoContext.legacySettings).forEach(
        (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
          this.SET_VIDEO_SETTING(key, this.state.videoContext.legacySettings[key]);
        },
      );
      Object.keys(this.state.videoContext.video).forEach((key: keyof obs.IVideo) => {
        this.SET_VIDEO_SETTING(key, this.state.videoContext.video[key]);
        if (
          invalidFps(this.state.videoContext.video.fpsNum, this.state.videoContext.video.fpsDen)
        ) {
          this.createDefaultFps();
        }
      });
    } else {
      // currently uses dummy data but will be refactored to use persisted data
      const data = display === 'horizontal' ? horizontalData : verticalData;

      this.state[display] = this.state[contextName].video;
      Object.keys(data).forEach(
        (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
          this.SET_VIDEO_SETTING(key, data[key], display);
          if (
            invalidFps(this.state[contextName].video.fpsNum, this.state[contextName].video.fpsDen)
          ) {
            this.createDefaultFps(display);
          }
        },
      );
    }

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
  createDefaultFps(display: TDisplayType = 'default') {
    this.setVideoSetting('fpsNum', 30, display);
    this.setVideoSetting('fpsDen', 1, display);
  }

  establishVideoContext(display: TDisplayType = 'default') {
    const contextName = contextNameMap[display];

    if (this.state[contextName]) return;

    this.state[contextName] = obs.VideoFactory.create();
    this.state[display] = {} as obs.IVideoInfo;
    this.migrateSettings(display);
    this.state[contextName].video = this.state[display];

    return !!this.state[contextName];
  }

  destroyVideoContext(display: TDisplayType = 'default') {
    const contextName = contextNameMap[display];
    if (this.state[contextName]) {
      const context: obs.IVideo = this.state[contextName];
      context.destroy();
    }
    this.DESTROY_VIDEO_CONTEXT(display);

    return !this.state[contextName];
  }

  @debounce(200)
  updateObsSettings(display: TDisplayType = 'default') {
    switch (display) {
      case 'default': {
        this.state.videoContext.video = this.state.default;
        break;
      }
      case 'horizontal': {
        this.state.horizontalContext.video = this.state.horizontal;
        break;
      }
      case 'vertical': {
        this.state.verticalContext.video = this.state.vertical;
        break;
      }
      default: {
        this.state.videoContext.video = this.state.default;
      }
    }
  }

  setVideoSetting(key: string, value: unknown, display: TDisplayType = 'default') {
    this.SET_VIDEO_SETTING(key, value, display);

    //@@@ TODO: Refactor to update settings for dual output displays
    if (display === 'default') {
      this.updateObsSettings();
    }
  }

  shutdown() {
    displays.forEach(display => {
      const contextName = contextNameMap[display];
      const context = this.state[contextName];
      if (context) {
        context.destroy();
      }
    });
  }

  @mutation()
  DESTROY_VIDEO_CONTEXT(display: TDisplayType = 'default') {
    const contextName = contextNameMap[display];
    this.state[contextName] = null as obs.IVideo;
    this.state[display] = null as obs.IVideoInfo;
  }

  @mutation()
  SET_VIDEO_SETTING(key: string, value: unknown, display: TDisplayType = 'default') {
    this.state[display] = {
      ...this.state[display],
      [key]: value,
    };
  }
}
