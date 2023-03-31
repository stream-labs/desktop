import { ViewHandler, PersistentStatefulService, Inject } from 'services/core';
import { mutation } from 'services/core/stateful-service';
import {
  IVideoSetting,
  verticalDisplayData,
  TDisplayType,
  VideoSettingsService,
} from './settings-v2';
import { IVideoInfo } from 'obs-studio-node';
import { DualOutputService } from './dual-output';
import { VideoService } from './video';

interface ISettingsManagerServiceState {
  videoSettings: {
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
    console.log(
      'this.state.videoSettings.activeDisplays ',
      this.state.videoSettings.activeDisplays,
    );
    const active: TDisplayType[] = Object.entries(this.state.videoSettings.activeDisplays).reduce(
      (displays: TDisplayType[], [key, value]: [TDisplayType, boolean]) => {
        if (value) {
          displays.push(key);
        }
        return displays;
      },
      [],
    );
    return active.length > 1 ? null : active[0];
  }
}

export class SettingsManagerService extends PersistentStatefulService<ISettingsManagerServiceState> {
  @Inject() private dualOutputService: DualOutputService;
  @Inject() videoService: VideoService;
  @Inject() videoSettingsService: VideoSettingsService;

  static defaultState = {
    videoSettings: {
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

  toggleDisplay(status: boolean, display?: TDisplayType) {
    if (
      this.state.videoSettings.activeDisplays.horizontal &&
      this.state.videoSettings.activeDisplays.vertical
    ) {
      // toggle off dual output mode
      this.setDisplayActive(status, display);
    } else if (display === 'horizontal' && status === false) {
      // toggle off horizontal display
      this.dualOutputService.sceneItemsConfirmed.subscribe(() => {
        this.setDisplayActive(status, display);
      });
      this.dualOutputService.actions.confirmOrCreateVerticalNodes();
    } else if (display === 'vertical' && status === true) {
      // toggle on vertical display
      this.dualOutputService.sceneItemsConfirmed.subscribe(() => {
        this.setDisplayActive(status, display);
      });
      this.dualOutputService.actions.confirmOrCreateVerticalNodes();
    } else {
      // toggle on dual output mode
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
  }

  @mutation()
  private SET_VIDEO_SETTING(setting: Partial<IVideoSetting>, display: TDisplayType = 'vertical') {
    this.state.videoSettings.activeDisplays = {
      ...this.state.videoSettings.activeDisplays,
      [display]: setting,
    };
  }
}
