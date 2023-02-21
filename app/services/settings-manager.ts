import { ViewHandler, PersistentStatefulService } from 'services/core';
import { mutation } from 'services/core/stateful-service';
import {
  TDefaultVideoSetting,
  IVideoSettings,
  horizontalDisplayData,
  verticalDisplayData,
} from './settings-v2';

interface ISettingsManagerServiceState {
  videoSettings: {
    defaultVideoSetting: TDefaultVideoSetting;
    defaultHorizontal: IVideoSettings;
    defaultVertical: IVideoSettings;
    horizontal: IVideoSettings;
    vertical: IVideoSettings;
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
  defaultState = {
    videoSettings: {
      defaultVideoSetting: 'default', // setting for default horizontal display pulled directly from obs so not persisted
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

  setDefaultDisplay(displaySetting: 'default' | 'defaultVertical') {
    this.SET_DEFAULT_DISPLAY(displaySetting);
  }

  @mutation()
  private SET_DEFAULT_DISPLAY(displaySetting: 'default' | 'defaultVertical') {
    this.state.videoSettings.defaultVideoSetting = displaySetting;
  }
}
