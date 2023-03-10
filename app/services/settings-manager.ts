// import { Service, ViewHandler } from 'services/core';
import * as obs from '../../obs-api';

// /*
// Eventually this service will be in charge of storing and managing settings profiles
// once the new persistant storage system is finalized. For now it just retrieves settings
// from the backend.
// */

// class SettingsManagerViews extends ViewHandler<{}> {}

// export class SettingsManagerService extends Service {

// }

import { ViewHandler, PersistentStatefulService, Inject } from 'services/core';
import { mutation } from 'services/core/stateful-service';
import { IVideoSetting, greenDisplayData, TDisplayType } from './settings-v2';
import { IVideoInfo } from 'obs-studio-node';
import { GreenService } from './green';

interface ISettingsManagerServiceState {
  videoSettings: {
    defaultDisplay: TDisplayType;
    green: IVideoInfo;
    activeDisplays: {
      horizontal: boolean;
      green: boolean;
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
  @Inject() private greenService: GreenService;
  static defaultState = {
    videoSettings: {
      defaultDisplay: 'horizontal',
      green: greenDisplayData, // get settings for horizontal display from obs directly
      activeDisplays: {
        horizontal: true,
        green: false,
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

  toggleDisplay(status: boolean, display?: TDisplayType) {
    if (
      this.state.videoSettings.activeDisplays.horizontal &&
      this.state.videoSettings.activeDisplays.green
    ) {
      this.setDisplayActive(status, display);
    } else if (display === 'horizontal' && status === false) {
      this.greenService.sceneItemsConfirmed.subscribe(() => {
        this.setDisplayActive(status, display);
      });
      this.greenService.actions.confirmOrCreateGreenNodes();
    } else if (display === 'green' && status === true) {
      this.greenService.sceneItemsConfirmed.subscribe(() => {
        this.setDisplayActive(status, display);
      });
      this.greenService.actions.confirmOrCreateGreenNodes();
    } else {
      this.setDisplayActive(status, display);
    }
  }

  setVideoSetting(setting: Partial<IVideoSetting>, display?: TDisplayType) {
    this.SET_VIDEO_SETTING(setting, display);
  }

  private setDisplayActive(status: boolean, display: TDisplayType) {
    this.SET_DISPLAY_ACTIVE(status, display);
  }

  @mutation()
  private SET_DISPLAY_ACTIVE(status: boolean, display: TDisplayType = 'horizontal') {
    const otherDisplay = display === 'horizontal' ? 'green' : 'horizontal';
    if (
      status === false &&
      this.state.videoSettings.activeDisplays[display] &&
      !this.state.videoSettings.activeDisplays[otherDisplay]
    ) {
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
  private SET_VIDEO_SETTING(setting: Partial<IVideoSetting>, display: TDisplayType = 'green') {
    this.state.videoSettings.activeDisplays = {
      ...this.state.videoSettings.activeDisplays,
      [display]: setting,
    };
  }
}
