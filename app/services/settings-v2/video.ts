import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';

export function invalidFps(num: number, den: number) {
  return num / den > 1000 || num / den < 1;
}

@InitAfter('UserService')
export class VideoSettingsService extends StatefulService<{ videoContext: obs.IVideo }> {
  @Inject() settingsManagerService: SettingsManagerService;

  initialState = {
    videoContext: null as obs.IVideo,
  };

  init() {
    this.establishVideoContext();
  }

  get videoSettingsValues() {
    const context = this.state.videoContext;
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

  get videoSettings() {
    return this.settingsManagerService.videoSettings;
  }

  migrateSettings() {
    Object.keys(this.videoSettings).forEach((key: keyof obs.IVideo) => {
      this.SET_VIDEO_SETTING(key, this.videoSettings[key]);
    });

    if (invalidFps(this.state.videoContext.fpsNum, this.state.videoContext.fpsDen)) {
      this.setVideoSetting('fpsNum', 30);
      this.setVideoSetting('fpsDen', 1);
    }
  }

  establishVideoContext() {
    if (this.state.videoContext) return;

    this.SET_VIDEO_CONTEXT();

    this.migrateSettings();
    obs.VideoFactory.videoContext = this.state.videoContext;
  }

  @debounce(200)
  updateObsSettings() {
    obs.VideoFactory.videoContext = this.state.videoContext;
    obs.VideoFactory.legacySettings = this.state.videoContext;
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
    this.state.videoContext[key] = value;
  }
}
