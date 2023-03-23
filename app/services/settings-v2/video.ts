import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { GreenService } from 'services/green';

/**
 * Display Types
 *
 * Add display type options by adding the display name to the displays array
 * and the context name to the context name map.
 */
const displays = ['default', 'horizontal', 'green'] as const;
export type TDisplayType = typeof displays[number];

export function invalidFps(num: number, den: number) {
  return num / den > 1000 || num / den < 1;
}

export interface IVideoSetting {
  default: obs.IVideoInfo;
  horizontal: obs.IVideoInfo;
  green: obs.IVideoInfo;
}

@InitAfter('SceneCollectionsService')
export class VideoSettingsService extends StatefulService<IVideoSetting> {
  @Inject() greenService: GreenService;

  initialState = {
    default: null as obs.IVideoInfo,
    horizontal: null as obs.IVideoInfo,
    green: null as obs.IVideoInfo,
  };

  init() {
    this.establishVideoContext();
    if (this.greenService.views.activeDisplays.green) {
      this.establishVideoContext('green');
    }
  }

  contexts = {
    default: null as obs.IVideo,
    horizontal: null as obs.IVideo,
    green: null as obs.IVideo,
  };

  get videoSettingsValues() {
    const context = this.contexts.horizontal;
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
    const context = this.contexts.horizontal;
    return {
      width: context.video.baseWidth,
      height: context.video.baseHeight,
    };
  }

  get isGreen(): boolean {
    return false;
  }

  get videoSettings() {
    return this.greenService.views.videoSettings;
  }

  migrateSettings(display?: TDisplayType) {
    if (display === 'default' || display === 'horizontal') {
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
      const data = this.videoSettings.green;

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

    return !!this.contexts[display];
  }

  createDefaultFps(display: TDisplayType = 'horizontal') {
    this.setVideoSetting('fpsNum', 30, display);
    this.setVideoSetting('fpsDen', 1, display);
  }

  @debounce(200)
  updateObsSettings(display: TDisplayType = 'horizontal') {
    switch (display) {
      case 'horizontal': {
        this.contexts.horizontal.video = this.state.horizontal;
        break;
      }
      case 'green': {
        this.contexts.green.video = this.state.green;
        break;
      }
      default: {
        this.contexts.horizontal.video = this.state.horizontal;
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
      this.greenService.setVideoSetting({ [key]: value });
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
  SET_VIDEO_CONTEXT() {
    this.contexts.horizontal = {} as obs.IVideo;
  }

  @mutation()
  SET_VIDEO_SETTING(key: string, value: unknown, display: TDisplayType = 'horizontal') {
    this.state[display] = {
      ...this.state[display],
      [key]: value,
    };
  }
}
