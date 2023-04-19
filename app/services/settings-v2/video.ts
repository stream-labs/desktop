import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { GreenService } from 'services/green';
import { SettingsService } from 'services/settings';
import { Subject } from 'rxjs';

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

export class VideoSettingsService extends StatefulService<IVideoSetting> {
  @Inject() greenService: GreenService;
  @Inject() settingsService: SettingsService;

  initialState = {
    default: null as obs.IVideoInfo,
    horizontal: null as obs.IVideoInfo,
    green: null as obs.IVideoInfo,
  };

  establishedContext = new Subject();

  init() {
    this.establishVideoContext();
    this.establishedContext.next();
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
    const context = this.state.horizontal;

    return {
      baseRes: `${context.baseWidth}x${context.baseHeight}`,
      outputRes: `${context.outputWidth}x${context.outputHeight}`,
      scaleType: context.scaleType,
      fpsType: context.fpsType,
      fpsCom: `${context.fpsNum}-${context.fpsDen}`,
      fpsNum: context.fpsNum,
      fpsDen: context.fpsDen,
      fpsInt: context.fpsNum,
    };
  }

  get baseResolution() {
    const context = this.state.horizontal;

    const [widthStr, heightStr] = this.settingsService.views.values.Video.Base.split('x');

    return {
      width: context?.baseWidth ?? parseInt(widthStr, 10),
      height: context?.baseHeight ?? parseInt(heightStr, 10),
    };
  }

  get isGreen(): boolean {
    return false;
  }

  get videoSettings() {
    return this.greenService.views.videoSettings;
  }

  migrateSettings(display: TDisplayType = 'horizontal') {
    this.SET_VIDEO_CONTEXT(display, true);

    if (display === 'horizontal') {
      Object.keys(this.contexts.horizontal.video).forEach((key: keyof obs.IVideo) => {
        this.SET_VIDEO_SETTING(key, this.contexts.horizontal.video[key]);
      });
    } else {
      const data = this.videoSettings.green;

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
    this.SET_VIDEO_CONTEXT(display, true);
    this.migrateSettings(display);
    this.contexts[display].video = this.state[display];

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
  SET_VIDEO_SETTING(key: string, value: unknown, display: TDisplayType = 'horizontal') {
    this.state[display][key] = value;
  }

  @mutation()
  SET_VIDEO_CONTEXT(display: TDisplayType = 'horizontal', reset?: boolean) {
    if (!reset) {
      this.state[display] = this.contexts[display].video;
    } else {
      this.state[display] = {} as obs.IVideoInfo;
    }
  }

  @mutation()
  REMOVE_CONTEXT(display: TDisplayType) {
    this.state[display] = null as obs.IVideoInfo;
  }
}
