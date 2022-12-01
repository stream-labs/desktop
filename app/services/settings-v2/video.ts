import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';

interface IVideoSettings {
  videoContext: obs.IVideo;
  allVideoSettings: obs.IVideoInfo;
  horizontalVideoSettings: obs.IVideoInfo;
  verticalVideoSettings: obs.IVideoInfo;
}
@InitAfter('UserService')
export class VideoSettingsService extends StatefulService<IVideoSettings> {
  @Inject() settingsManagerService: SettingsManagerService;

  initialState = {
    videoContext: null as obs.IVideo,
    allVideoSettings: null as obs.IVideoInfo,
    horizontalVideoSettings: null as obs.IVideoInfo,
    verticalVideoSettings: null as obs.IVideoInfo,
  };

  init() {
    this.establishVideoContext();
  }

  get videoSettingsValues() {
    const settings = this.state.allVideoSettings;

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

  get videoContext() {
    return this.state.videoContext;
  }

  // @@@ TODO: Refactor for persistence
  // get videoSettings() {
  //   return this.settingsManagerService.videoSettings;
  // }

  migrateSettings() {
    this.state.allVideoSettings = this.state.videoContext.video;
    Object.keys(this.state.videoContext.legacySettings).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.SET_VIDEO_SETTING(key, this.state.videoContext.legacySettings[key]);
      },
    );
  }

  establishVideoContext() {
    if (this.state.videoContext) return;

    this.SET_VIDEO_CONTEXT();

    this.migrateSettings();
    this.state.videoContext.video = this.state.allVideoSettings;
  }

  @debounce(200)
  updateObsSettings() {
    this.state.videoContext.video = this.state.allVideoSettings;
  }

  setVideoSetting(key: string, value: unknown) {
    this.SET_VIDEO_SETTING(key, value);
    this.updateObsSettings();
  }

  shutdown() {
    this.state.videoContext.destroy();
  }

  @mutation()
  SET_VIDEO_CONTEXT() {
    this.state.videoContext = obs.VideoFactory.create();
    this.state.allVideoSettings = {} as obs.IVideoInfo;
  }

  @mutation()
  SET_VIDEO_SETTING(key: string, value: unknown) {
    if (key === 'baseWidth') console.log('baseWidth ', key);
    if (key === 'baseHeight') console.log('baseHeight ', key);
    this.state.allVideoSettings = { ...this.state.allVideoSettings, [key]: value };
  }
}
