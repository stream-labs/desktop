import { ViewHandler, PersistentStatefulService } from 'services/core';
import { mutation } from 'services/core/stateful-service';
import { IVideoSetting, verticalDisplayData, TDisplayType } from './settings-v2';
import { IVideoInfo } from 'obs-studio-node';

interface ISettingsManagerServiceState {
  videoSettings: {
    defaultDisplay: TDisplayType;
    vertical: IVideoInfo;
    activeDisplays: {
      horizontal: boolean;
      vertical: boolean;
    };
  };
}

class SettingsManagerServiceViews extends ViewHandler<ISettingsManagerServiceState> {
  get videoSettings() {
    return this.state.videoSettings;
  }

  get activeDisplays() {
    return this.state.videoSettings.activeDisplays;
  }

  get defaultDisplay() {
    const active = Object.entries(this.state.videoSettings.activeDisplays).map(([key, value]) => {
      if (value === true) {
        return { key };
      }
    });
    return active.length > 1 ? null : active[0];
  }
}

export class SettingsManagerService extends PersistentStatefulService<ISettingsManagerServiceState> {
  static defaultState = {
    videoSettings: {
      defaultDisplay: 'horizontal',
      vertical: verticalDisplayData, // get settings for horizontal display from obs directly
      activeDisplays: {
        horizontal: true,
        vertical: false,
      },
    },
  };

  init() {
    super.init();
  }

  get views() {
    return new SettingsManagerServiceViews(this.state);
  }

  /**
   * VIDEO SETTINGS FUNCTIONS
   */

  setDisplayActive(status: boolean, display?: TDisplayType) {
    console.log('this.views.defaultDisplay ', this.views.defaultDisplay);
    this.SET_DISPLAY_ACTIVE(status, display);
  }

  setVideoSetting(setting: Partial<IVideoSetting>, display?: TDisplayType) {
    this.SET_VIDEO_SETTING(setting, display);
  }

  @mutation()
  private SET_DISPLAY_ACTIVE(status: boolean, display: TDisplayType = 'horizontal') {
    const otherDisplay = display === 'horizontal' ? 'vertical' : 'horizontal';

    if (
      status === false &&
      this.state.videoSettings.activeDisplays[display] &&
      !this.state.videoSettings.activeDisplays[otherDisplay]
    ) {
      // if not dual output mode, swap the active displays
      this.state.videoSettings.activeDisplays = {
        ...this.state.videoSettings.activeDisplays,
        [display]: status,
        [otherDisplay]: !status,
      };
    } else {
      this.state.videoSettings.activeDisplays = {
        ...this.state.videoSettings.activeDisplays,
        [display]: status,
      };
    }

    this.state.videoSettings.defaultDisplay = display;
  }

  @mutation()
  private SET_VIDEO_SETTING(setting: Partial<IVideoSetting>, display: TDisplayType = 'vertical') {
    this.state.videoSettings.activeDisplays = {
      ...this.state.videoSettings.activeDisplays,
      [display]: setting,
    };
  }
}
