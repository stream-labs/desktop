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
    return this.state.videoSettings.defaultDisplay;
  }

  get isHorizontalActive() {
    return this.state.videoSettings.activeDisplays.horizontal;
  }

  get isVerticalActive() {
    return this.state.videoSettings.activeDisplays.vertical;
  }
}

export class SettingsManagerService extends PersistentStatefulService<ISettingsManagerServiceState> {
  @Inject() private dualOutputService: DualOutputService;
  @Inject() videoService: VideoService;
  @Inject() videoSettingsService: VideoSettingsService;

  static defaultState = {
    isHorizontalDefault: true,
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

  toggleDisplay(status: boolean, display: TDisplayType) {
    // swap default display if needed
    if (!status) {
      const otherDisplay = display === 'horizontal' ? 'vertical' : 'horizontal';
      this.setDefaultDisplay(otherDisplay);
    }

    if (
      this.state.videoSettings.activeDisplays.horizontal &&
      this.state.videoSettings.activeDisplays.vertical
    ) {
      // toggle off dual output mode
      this.setDisplayActive(false, display);
    } else {
      // toggle display
      this.dualOutputService.sceneItemsConfirmed.subscribe(() => {
        this.setDisplayActive(status, display);
      });
      this.dualOutputService.actions.confirmOrCreateVerticalNodes();
    }
  }

  setVideoSetting(setting: Partial<IVideoSetting>, display?: TDisplayType) {
    this.SET_VIDEO_SETTING(setting, display);
  }

  setDefaultDisplay(display: TDisplayType) {
    this.SET_DEFAULT_DISPLAY(display);
  }

  private setDisplayActive(status: boolean, display: TDisplayType) {
    this.SET_DISPLAY_ACTIVE(status, display);
  }

  @mutation()
  private SET_DISPLAY_ACTIVE(status: boolean, display: TDisplayType) {
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

  @mutation()
  private SET_DEFAULT_DISPLAY(display: TDisplayType) {
    this.state.videoSettings.defaultDisplay = display;
  }
}
