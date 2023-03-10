import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';

/**
 * Display Types
 *
 * Add display type options by adding the display name to the displays array
 * and the context name to the context name map.
 */
const displays = ['default', 'horizontal', 'green'] as const;
export type TDisplayType = typeof displays[number];

const contextNameMap: Record<TDisplayType, string> = {
  default: 'defaultContext',
  horizontal: 'horizontalContext',
  green: 'greenContext',
};

export function invalidFps(num: number, den: number) {
  return num / den > 1000 || num / den < 1;
}

export interface IVideoSetting {
  defaultContext: obs.IVideo;
  horizontalContext: obs.IVideo;
  greenContext: obs.IVideo;
  default: obs.IVideoInfo;
  horizontal: obs.IVideoInfo;
  green: obs.IVideoInfo;
  // outputIdMap: { [key: string]: number } // @@@ TODO: map outputId to context when created. Key is context name
}

@InitAfter('UserService')
@InitAfter('SettingsManagerService')
@InitAfter('SceneCollectionsService')
export class VideoSettingsService extends StatefulService<IVideoSetting> {
  @Inject() settingsManagerService: SettingsManagerService;

  initialState = {
    defaultContext: null as obs.IVideo,
    horizontalContext: null as obs.IVideo,
    greenContext: null as obs.IVideo,
    default: null as obs.IVideoInfo,
    horizontal: null as obs.IVideoInfo,
    green: null as obs.IVideoInfo,
  };

  init() {
    this.establishVideoContext();
    if (this.settingsManagerService.views.activeDisplays.green) {
      this.establishVideoContext('green');
    }
  }

  get contexts() {
    return {
      default: this.state.horizontalContext,
      horizontal: this.state.horizontalContext,
      green: this.state.greenContext,
    };
  }

  get videoSettingsValues() {
    const context = this.state.horizontalContext;
    return {
      baseRes: `${context.video.baseWidth}x${context.video.baseHeight}`,
      outputRes: `${context.video.outputWidth}x${context.video.outputHeight}`,
      scaleType: context.video.scaleType,
      fpsType: context.video.fpsType,
      fpsCom: `${context.video.fpsNum}-${context.video.fpsDen}`,
      fpsNum: context.video.fpsNum,
      fpsDen: context.video.fpsDen,
      fpsInt: context.video.fpsNum,
    };
  }

  get baseResolution() {
    const context = this.state.horizontalContext;
    return {
      width: context.video.baseWidth,
      height: context.video.baseHeight,
    };
  }

  get isGreen(): boolean {
    return false;
  }

  get videoSettings() {
    return this.settingsManagerService.views.videoSettings;
  }

  getBaseResolution(display: TDisplayType = 'horizontal') {
    return `${this.state[display].baseWidth}x${this.state[display].baseHeight}`;
  }

  migrateSettings(display?: TDisplayType) {
    const contextName = contextNameMap[display];

    if (display === 'default' || display === 'horizontal') {
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
      const data = this.videoSettings.green;

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

  createDefaultFps(display: TDisplayType = 'horizontal') {
    this.setVideoSetting('fpsNum', 30, display);
    this.setVideoSetting('fpsDen', 1, display);
  }

  @debounce(200)
  updateObsSettings(display: TDisplayType = 'horizontal') {
    switch (display) {
      case 'horizontal': {
        this.state.horizontalContext.video = this.state.default;
        break;
      }
      case 'green': {
        this.state.greenContext.video = this.state.green;
        break;
      }
      default: {
        this.state.horizontalContext.video = this.state.default;
      }
    }
  }

  resetToDefaultContext() {
    for (const context in this.contexts) {
      if (context !== 'horizontal') {
        this.destroyVideoContext(context as TDisplayType);
      }
    }
  }

  setVideoSetting(key: string, value: unknown, display: TDisplayType = 'horizontal') {
    this.SET_VIDEO_SETTING(key, value, display);

    if (display === 'horizontal') {
      this.updateObsSettings();
    } else if (display === 'green') {
      // if the display is green, also update the persisted settings
      this.updateObsSettings('green');
      this.settingsManagerService.setVideoSetting({ [key]: value });
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
  SET_VIDEO_CONTEXT() {
    this.state.horizontalContext = {} as obs.IVideo;
  }

  @mutation()
  SET_VIDEO_SETTING(key: string, value: unknown, display: TDisplayType = 'horizontal') {
    this.state[display] = {
      ...this.state[display],
      [key]: value,
    };
  }
}
