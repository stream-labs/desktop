import { debounce } from 'lodash-decorators';
import { Inject } from 'services/core/injector';
import { InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';

interface IVideoSettingsServiceState {
  videoContext: obs.IVideo;
  forceGPU: boolean;
}

export function invalidFps(num: number, den: number) {
  return num / den > 1000 || num / den < 1;
}

@InitAfter('UserService')
export class VideoSettingsService extends StatefulService<IVideoSettingsServiceState> {
  @Inject() settingsManagerService: SettingsManagerService;

  static initialState: IVideoSettingsServiceState = {
    videoContext: null as obs.IVideo,
    forceGPU: false,
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

  get advancedSettingsValues() {
    const context = this.state.videoContext;
    return {
      outputFormat: context.outputFormat,
      colorSpace: context.colorspace,
      range: context.range,
      forceGPU: this.state.forceGPU,
    };
  }

  get videoSettings() {
    return this.settingsManagerService.videoSettings;
  }

  migrateSettings() {
    Object.keys(this.videoSettings).forEach((key: keyof obs.IVideo) => {
      this.SET_VIDEO_SETTING(key, this.videoSettings[key]);
    });
    this.SET_FORCE_GPU(this.settingsManagerService.forceGPURRendering);

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

  setForceGPU(val: boolean) {
    this.SET_FORCE_GPU(val);
    obs.NodeObs.SetForceGPURendering(val);
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

  @mutation()
  SET_FORCE_GPU(val: boolean) {
    this.state.forceGPU = val;
  }
}
