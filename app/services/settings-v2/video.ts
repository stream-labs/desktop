import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';

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

export type TDisplayType = 'default' | 'horizontal' | 'vertical';

interface IVideoSettings {
  videoContext: obs.IVideo;
  horizontalContext: obs.IVideo;
  verticalContext: obs.IVideo;
  default: obs.IVideoInfo;
  horizontal: obs.IVideoInfo;
  vertical: obs.IVideoInfo;
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
    return this.contexts;
  }

  get contexts() {
    return {
      default: this.videoSettingsValues,
      horizontal: this.horizontalSettingsValues,
      vertical: this.verticalSettingsValues,
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

  // @@@ TODO: Refactor for persistence
  // get videoSettings() {
  //   return this.settingsManagerService.videoSettings;
  // }

  getBaseResolution(display = 'default' as TDisplayType) {
    console.log(
      `${display} display`,
      `${this.state[display].baseWidth}x${this.state[display].baseHeight}`,
    );
    return `${this.state[display].baseWidth}x${this.state[display].baseHeight}`;
  }

  formatVideoSettings(display = 'default' as TDisplayType) {
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
  }

  migrateSettings() {
    // @@@ TODO: Remove use of horizontal and vertical dummy data when persistence is implemented

    this.state.default = this.state.videoContext.video;
    Object.keys(this.state.videoContext.legacySettings).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.SET_VIDEO_SETTING(key, this.state.videoContext.legacySettings[key]);
      },
    );

    Object.keys(this.state.videoContext.video).forEach((key: keyof obs.IVideo) => {
      this.SET_VIDEO_SETTING(key, this.state.videoContext.video[key]);
      if (
        invalidFps(
          this.state.horizontalContext.video.fpsNum,
          this.state.horizontalContext.video.fpsDen,
        )
      ) {
        this.createDefaultFps();
      }
    });

    // horizontal video settings
    this.state.horizontal = this.state.horizontalContext.video;
    Object.keys(horizontalData).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.SET_VIDEO_SETTING(key, horizontalData[key], 'horizontal');
        if (
          invalidFps(
            this.state.horizontalContext.video.fpsNum,
            this.state.horizontalContext.video.fpsDen,
          )
        ) {
          this.createDefaultFps('horizontal');
        }
      },
    );

    // vertical video settings
    this.state.vertical = this.state.verticalContext.video;
    Object.keys(verticalData).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.SET_VIDEO_SETTING(key, verticalData[key], 'vertical');
        if (
          invalidFps(
            this.state.verticalContext.video.fpsNum,
            this.state.verticalContext.video.fpsDen,
          )
        ) {
          this.createDefaultFps('vertical');
        }
      },
    );

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
  createDefaultFps(display = 'default' as TDisplayType) {
    this.setVideoSetting('fpsNum', 30, display);
    this.setVideoSetting('fpsDen', 1, display);
  }

  establishVideoContext() {
    if (this.state.videoContext) return;

    this.SET_VIDEO_CONTEXT();

    this.migrateSettings();
    this.state.videoContext.video = this.state.default;
  }

  @debounce(200)
  updateObsSettings(display = 'default' as TDisplayType) {
    // this.state.videoContext.video = this.state.default;
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
    this.state.videoContext.destroy();
    this.state.horizontalContext.destroy();
    this.state.verticalContext.destroy();
  }

  @mutation()
  SET_VIDEO_CONTEXT() {
    this.state.videoContext = obs.VideoFactory.create();
    this.state.horizontalContext = obs.VideoFactory.create();
    this.state.verticalContext = obs.VideoFactory.create();
    this.state.default = {} as obs.IVideoInfo;
    this.state.horizontal = {} as obs.IVideoInfo;
    this.state.vertical = {} as obs.IVideoInfo;
  }

  @mutation()
  SET_VIDEO_SETTING(key: string, value: unknown, display: TDisplayType = 'default') {
    this.state[display] = {
      ...this.state[display],
      [key]: value,
    };
  }
}
