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

interface IVideoSettings {
  videoContext: obs.IVideo;
  horizontalContext: obs.IVideo;
  verticalContext: obs.IVideo;
  allVideoSettings: obs.IVideoInfo;
  horizontalVideoSettings: obs.IVideoInfo;
  verticalVideoSettings: obs.IVideoInfo;
}
@InitAfter('UserService')
export class VideoSettingsService extends StatefulService<IVideoSettings> {
  @Inject() settingsManagerService: SettingsManagerService;

  initialState = {
    videoContext: null as obs.IVideo,
    horizontalContext: null as obs.IVideo,
    verticalContext: null as obs.IVideo,
    allVideoSettings: null as obs.IVideoInfo,
    horizontalVideoSettings: null as obs.IVideoInfo,
    verticalVideoSettings: null as obs.IVideoInfo,
  };

  init() {
    this.establishVideoContext();
  }

  get videoSettingsValues() {
    return this.formatVideoSettings();
  }

  get horizontalSettingsValues() {
    return this.formatVideoSettings('horizontal');
  }

  get verticalSettingsValues() {
    return this.formatVideoSettings('vertical');
  }

  get videoContext() {
    return this.state.videoContext;
  }

  // @@@ TODO: Refactor for persistence
  // get videoSettings() {
  //   return this.settingsManagerService.videoSettings;
  // }

  formatVideoSettings(display: string = 'all') {
    const settings = this.state[`${display}VideoSettings`];

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

  migrateSettings() {
    // @@@ TODO: Remove use of dummy data when persistence is implemented

    this.state.allVideoSettings = this.state.videoContext.video;
    Object.keys(this.state.videoContext.legacySettings).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.SET_VIDEO_SETTING(key, this.state.videoContext.legacySettings[key]);
      },
    );

    // horizontal video settings
    this.state.horizontalVideoSettings = this.state.horizontalContext.video;
    Object.keys(horizontalData).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.SET_VIDEO_SETTING(key, horizontalData[key], 'horizontal');
      },
    );

    // vertical video settings
    this.state.verticalVideoSettings = this.state.verticalContext.video;
    Object.keys(verticalData).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.SET_VIDEO_SETTING(key, verticalData[key], 'vertical');
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
    this.state.horizontalContext.destroy();
    this.state.verticalContext.destroy();
  }

  @mutation()
  SET_VIDEO_CONTEXT() {
    this.state.videoContext = obs.VideoFactory.create();
    this.state.horizontalContext = obs.VideoFactory.create();
    this.state.verticalContext = obs.VideoFactory.create();
    this.state.allVideoSettings = {} as obs.IVideoInfo;
    this.state.horizontalVideoSettings = {} as obs.IVideoInfo;
    this.state.verticalVideoSettings = {} as obs.IVideoInfo;
  }

  @mutation()
  SET_VIDEO_SETTING(key: string, value: unknown, display: string = 'all') {
    console.log('----------> DISPLAY ', display);
    if (key === 'baseWidth') console.log('baseWidth ', key);
    if (key === 'baseHeight') console.log('baseHeight ', key);

    const propertyName = `${display}VideoSettings`;
    console.log('propertyName', propertyName);

    this.state[propertyName] = {
      ...this.state[propertyName],
      [key]: value,
    };
  }
}
