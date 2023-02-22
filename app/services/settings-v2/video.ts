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

const contextNameMap: Record<TDisplayType, string> = {
  default: 'videoContext',
  horizontal: 'horizontalContext',
  vertical: 'verticalContext',
};

export interface IVideoSetting {
  videoContext: obs.IVideo;
  horizontalContext: obs.IVideo;
  verticalContext: obs.IVideo;
  default: obs.IVideoInfo;
  horizontal: obs.IVideoInfo;
  vertical: obs.IVideoInfo;
  // outputIdMap: { [key: string]: number } // @@@ TODO: map outputId to context when created. Key is context name
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

@InitAfter('UserService')
@InitAfter('SettingsManagerService')
export class VideoSettingsService extends StatefulService<IVideoSetting> {
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
      default: this.state.horizontalContext,
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
    return this.state.horizontalContext;
  }

  get hasAdditionalContexts() {
    return !!this.state.horizontalContext && !!this.state.verticalContext;
  }

  get videoSettings() {
    console.log(
      'this.settingsManagerService.views.videoSettings ',
      this.settingsManagerService.views.videoSettings,
    );
    return this.settingsManagerService.views.videoSettings;
  }

  getVideoContext(display: TDisplayType) {
    const contextName = contextNameMap[display];
    return this.state[contextName];
  }

  getBaseResolution(display: TDisplayType = 'horizontal') {
    return `${this.state[display].baseWidth}x${this.state[display].baseHeight}`;
  }

  formatVideoSettings(display: TDisplayType = 'horizontal') {
    let settings;
    if (display === 'horizontal' || this.dualOutputService.views.dualOutputMode) {
      settings = this.state[display];
    } else {
      settings = this.settingsManagerService.views.videoSettings.vertical;
    }

    console.log('display ', display, ' settings ', settings);

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

    if (display === 'default' || display === 'horizontal') {
      // if this the default display is the horizontal display, get the settings from obs
      // @@@ TODO: handle vertical being the default display
      this.state.horizontal = this.state.horizontalContext.video;
      Object.keys(this.state.horizontalContext.legacySettings).forEach(
        (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
          this.SET_VIDEO_SETTING(key, this.state.horizontalContext.legacySettings[key]);
        },
      );
      Object.keys(this.state.horizontalContext.video).forEach((key: keyof obs.IVideo) => {
        this.SET_VIDEO_SETTING(key, this.state.horizontalContext.video[key]);
        if (
          invalidFps(
            this.state.horizontalContext.video.fpsNum,
            this.state.horizontalContext.video.fpsDen,
          )
        ) {
          this.createDefaultFps();
        }
      });
    } else {
      // if dual output mode is active, apply settings from the settings manager
      // const data =
      //   display === 'horizontal' ? this.videoSettings.horizontal : this.videoSettings.vertical;
      const data = this.videoSettings.vertical;

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
    const contextName = contextNameMap[display];

    if (this.state[contextName]) return;

    this.state[contextName] = obs.VideoFactory.create();
    this.state[display] = {} as obs.IVideoInfo;
    this.migrateSettings(display);
    this.state[contextName].video = this.state[display];

    return !!this.state[contextName];
  }

  destroyVideoContext(display: TDisplayType = 'horizontal') {
    const contextName = contextNameMap[display];
    if (this.state[contextName]) {
      const context: obs.IVideo = this.state[contextName];
      context.destroy();
    }
    this.DESTROY_VIDEO_CONTEXT(display);

    return !this.state[contextName];
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
        this.state.horizontalContext.video = this.state.horizontal;
        break;
      }
      case 'vertical': {
        this.state.verticalContext.video = this.state.vertical;
        break;
      }
      default: {
        this.state.horizontalContext.video = this.state.horizontal;
      }
    }
  }

  setVideoSetting(key: string, value: unknown, display: TDisplayType = 'horizontal') {
    this.SET_VIDEO_SETTING(key, value, display);

    //@@@ TODO: Refactor to update settings for dual output displays
    if (display === 'horizontal') {
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
  DESTROY_VIDEO_CONTEXT(display: TDisplayType = 'horizontal') {
    const contextName = contextNameMap[display];
    this.state[contextName] = null as obs.IVideo;
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
