import { ViewHandler, PersistentStatefulService } from 'services/core';
import { mutation } from 'services/core/stateful-service';
import {
  IVideoSetting,
  horizontalDisplayData,
  verticalDisplayData,
  TDisplayType,
} from './settings-v2';
import * as obs from 'obs-studio-node';

interface ISettingsManagerServiceState {
  videoSettings: {
    defaultVideoSetting: TDisplayType;
    defaultHorizontal: obs.IVideoInfo;
    defaultVertical: obs.IVideoInfo;
    horizontal: obs.IVideoInfo;
    vertical: obs.IVideoInfo;
  };
}

class SettingsManagerServiceViews extends ViewHandler<ISettingsManagerServiceState> {
  get videoSettings() {
    return this.state.videoSettings;
  }

  get defaultVideoSetting() {
    return this.state.videoSettings.defaultVideoSetting;
  }
}

export class SettingsManagerService extends PersistentStatefulService<ISettingsManagerServiceState> {
  static defaultState = {
    videoSettings: {
      defaultVideoSetting: 'horizontal', // setting for default horizontal display pulled directly from obs so not persisted
      defaultVertical: verticalDisplayData, // setting for default vertical display
      horizontal: horizontalDisplayData, // setting for dual output horizontal display
      vertical: verticalDisplayData, // setting for dual output vertical display
    },
  };

  init() {
    super.init();
  }

  get views() {
    return new SettingsManagerServiceViews(this.state);
  }

  setDefaultDisplay(displaySetting: TDisplayType) {
    this.SET_DEFAULT_DISPLAY(displaySetting);
  }

  setVideoSetting(setting: Partial<IVideoSetting>, display?: TDisplayType) {
    this.SET_VIDEO_SETTING(setting, display);
  }

  @mutation()
  private SET_DEFAULT_DISPLAY(displaySetting: TDisplayType) {
    this.state.videoSettings.defaultVideoSetting = displaySetting;
  }

  @mutation()
  private SET_VIDEO_SETTING(setting: Partial<IVideoSetting>, display: TDisplayType = 'vertical') {
    this.state.videoSettings[display] = { ...this.state.videoSettings[display], setting };
  }
}
