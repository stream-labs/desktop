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

  get videoSettings() {
    return this.settingsManagerService.videoSettings;
  }

  migrateSettings() {
    this.state.videoContext = this.videoSettings;
    Object.keys(this.videoSettings.legacySettings).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.SET_VIDEO_SETTING(key, this.videoSettings.legacySettings[key]);
      },
    );
    console.log('this.state.videoContext 2 ', this.state.videoContext);
  }

  establishVideoContext() {
    const context = obs.VideoFactory.create();
    if (this.state.videoContext) return;

    this.SET_VIDEO_CONTEXT();

    console.log('this.state.videoContext ', this.state.videoContext);

    this.migrateSettings();
    context.video = this.state.videoContext.video;
    context.legacySettings = this.state.videoContext.legacySettings;

    context.destroy();
  }

  @debounce(200)
  updateObsSettings() {
    const context = obs.VideoFactory.create();
    // context.video = this.state.allVideoSettings;
    this.state.videoContext.video = { ...this.state.allVideoSettings };
    context.destroy();
  }

  setVideoSetting(key: string, value: unknown) {
    this.SET_VIDEO_SETTING(key, value);
    this.updateObsSettings();
  }

  @mutation()
  SET_VIDEO_CONTEXT() {
    this.state.videoContext = {} as obs.IVideo;
  }

  @mutation()
  SET_VIDEO_SETTING(key: string, value: unknown) {
    if (key === 'baseWidth') console.log('baseWidth ', key);
    if (key === 'baseHeight') console.log('baseHeight ', key);
    this.state.allVideoSettings = { ...this.state.allVideoSettings, [key]: value };
    // this.state.videoContext.video[key] = value;
  }
}
