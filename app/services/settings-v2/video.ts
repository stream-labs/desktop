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

export type TDisplayType = 'default' | 'horizontal' | 'vertical';

interface IVideoSettings {
  videoContext: obs.IVideo;
  horizontalContext: obs.IVideo;
  verticalContext: obs.IVideo;
  default: obs.IVideoInfo;
  horizontal: obs.IVideoInfo;
  vertical: obs.IVideoInfo;
}
@InitAfter('UserService')
export class VideoSettingsService extends StatefulService<IVideoSettings> {
  @Inject() settingsManagerService: SettingsManagerService;

  initialState = {
    videoContext: null as obs.IVideo,
    horizontalContext: null as obs.IVideo,
    verticalContext: null as obs.IVideo,
    default: null as obs.IVideoInfo,
    horizontal: null as obs.IVideoInfo,
    vertical: null as obs.IVideoInfo,
  };

  init() {
    this.establishVideoContext();
  }

  get values() {
    return {
      default: this.videoSettingsValues,
      horizontal: this.horizontalSettingsValues,
      vertical: this.verticalSettingsValues,
    };
  }

  get videoSettingsValues() {
    return this.formatVideoSettings('default');
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

  formatVideoSettings(display: TDisplayType = 'default') {
    const settings = this.state[display];

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

    this.state.default = this.state.videoContext.video;
    Object.keys(this.state.videoContext.legacySettings).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.SET_VIDEO_SETTING(key, this.state.videoContext.legacySettings[key]);
      },
    );

    // horizontal video settings
    this.state.horizontal = this.state.horizontalContext.video;
    Object.keys(horizontalData).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.SET_VIDEO_SETTING(key, horizontalData[key], 'horizontal');
      },
    );

    // vertical video settings
    this.state.vertical = this.state.verticalContext.video;
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
    this.state.videoContext.video = this.state.default;
  }

  @debounce(200)
  updateObsSettings(display: TDisplayType = 'default') {
    // this.state.videoContext.video = this.state.default;
    switch (display) {
      case 'default': {
        this.state.videoContext.video = this.state.default;
        break;
      }
      case 'horizontal': {
        this.state.horizontalContext.video = this.state.horizontal;
        break;
      }
      case 'vertical': {
        this.state.verticalContext.video = this.state.vertical;
        break;
      }
      default: {
        this.state.videoContext.video = this.state.default;
      }
    }
  }

  setVideoSetting(key: string, value: unknown, display: TDisplayType) {
    this.SET_VIDEO_SETTING(key, value, display);
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
    this.state.default = {} as obs.IVideoInfo;
    this.state.horizontal = {} as obs.IVideoInfo;
    this.state.vertical = {} as obs.IVideoInfo;
  }

  @mutation()
  SET_VIDEO_SETTING(key: string, value: unknown, display: TDisplayType = 'default') {
    console.log('----------> DISPLAY ', display);
    if (key === 'baseWidth') console.log('baseWidth ', key);
    if (key === 'baseHeight') console.log('baseHeight ', key);

    console.log('display', display);

    this.state[display] = {
      ...this.state[display],
      [key]: value,
    };
  }
}

//   videoSettingsValues() {
//     const settings = this.state.default;

//     return {
//       baseRes: `${settings.baseWidth}x${settings.baseHeight}`,
//       outputRes: `${settings.outputWidth}x${settings.outputHeight}`,
//       scaleType: settings.scaleType,
//       fpsType: settings.fpsType,
//       fpsCom: `${settings.fpsNum}-${settings.fpsDen}`,
//       fpsNum: settings.fpsNum,
//       fpsDen: settings.fpsDen,
//       fpsInt: settings.fpsNum,
//     };
//   }

//   // get defaultSettingsValues() {
//   //   return {
//   //     baseRes: `${this.state.default.baseWidth}x${this.state.default.baseHeight}`,
//   //     outputRes: `${this.state.default.outputWidth}x${this.state.default.outputHeight}`,
//   //     scaleType: this.state.default.scaleType,
//   //     fpsType: this.state.default.fpsType,
//   //     fpsCom: `${this.state.default.fpsNum}-${this.state.default.fpsDen}`,
//   //     fpsNum: this.state.default.fpsNum,
//   //     fpsDen: this.state.default.fpsDen,
//   //     fpsInt: this.state.default.fpsNum,
//   //   };
//   //   // return this.videoSettingsValues('default');
//   // }

//   // get horizontalSettingsValues() {
//   //   return {
//   //     baseRes: `${this.state.horizontal.baseWidth}x${this.state.horizontal.baseHeight}`,
//   //     outputRes: `${this.state.horizontal.outputWidth}x${this.state.horizontal.outputHeight}`,
//   //     scaleType: this.state.horizontal.scaleType,
//   //     fpsType: this.state.horizontal.fpsType,
//   //     fpsCom: `${this.state.horizontal.fpsNum}-${this.state.horizontal.fpsDen}`,
//   //     fpsNum: this.state.horizontal.fpsNum,
//   //     fpsDen: this.state.horizontal.fpsDen,
//   //     fpsInt: this.state.horizontal.fpsNum,
//   //   };
//   //   // return this.videoSettingsValues('horizontal');
//   // }

//   // get verticalSettingsValues() {
//   //   return {
//   //     baseRes: `${this.state.vertical.baseWidth}x${this.state.vertical.baseHeight}`,
//   //     outputRes: `${this.state.vertical.outputWidth}x${this.state.vertical.outputHeight}`,
//   //     scaleType: this.state.vertical.scaleType,
//   //     fpsType: this.state.vertical.fpsType,
//   //     fpsCom: `${this.state.vertical.fpsNum}-${this.state.vertical.fpsDen}`,
//   //     fpsNum: this.state.vertical.fpsNum,
//   //     fpsDen: this.state.vertical.fpsDen,
//   //     fpsInt: this.state.vertical.fpsNum,
//   //   };
//   //   // return this.videoSettingsValues('vertical');
//   // }

//   // videoSettingsValues(display?: string) {
//   //   const settings = this.state[`${display ?? 'default'}VideoSettings`];

//   //   return {
//   //     baseRes: `${settings.baseWidth}x${settings.baseHeight}`,
//   //     outputRes: `${settings.outputWidth}x${settings.outputHeight}`,
//   //     scaleType: settings.scaleType,
//   //     fpsType: settings.fpsType,
//   //     fpsCom: `${settings.fpsNum}-${settings.fpsDen}`,
//   //     fpsNum: settings.fpsNum,
//   //     fpsDen: settings.fpsDen,
//   //     fpsInt: settings.fpsNum,
//   //   };
//   // }

//   get videoContext() {
//     return this.state.videoContext;
//   }

//   // @@@ TODO: Refactor for persistence
//   // get videoSettings() {
//   //   return this.settingsManagerService.videoSettings;
//   // }

//   migrateSettings() {
//     // @@@ TODO: Remove assignment of dummy data when persistence is implemented
//     // this.state.horizontalContext.legacySettings = horizontalData;
//     // this.state.verticalContext.legacySettings = verticalData;
//     // ^^^

//     // default video settings
//     this.state.default = this.state.videoContext.video;
//     Object.keys(this.state.videoContext.legacySettings).forEach(
//       (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
//         this.SET_VIDEO_SETTING(key, this.state.videoContext.legacySettings[key]);
//       },
//     );

//     // horizontal video settings
//     this.state.horizontal = this.state.horizontalContext.video;
//     Object.keys(this.state.horizontalContext.legacySettings).forEach(
//       (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
//         this.SET_VIDEO_SETTING(key, this.state.horizontalContext.legacySettings[key], 'horizontal');
//       },
//     );

//     // vertical video settings
//     this.state.vertical = this.state.verticalContext.video;
//     Object.keys(this.state.verticalContext.legacySettings).forEach(
//       (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
//         this.SET_VIDEO_SETTING(key, this.state.verticalContext.legacySettings[key], 'vertical');
//       },
//     );
//   }

//   establishVideoContext() {
//     if (this.state.videoContext) return;

//     this.SET_VIDEO_CONTEXT();

//     this.migrateSettings();
//     this.state.videoContext.video = this.state.default;
//     this.state.horizontalContext.video = this.state.horizontal;
//     this.state.verticalContext.video = this.state.vertical;
//   }

//   @debounce(200)
//   updateObsSettings(display: string) {
//     this.state.videoContext.video = this.state.default;
//     // if (display === 'default') {
//     //   this.state.videoContext.video = this.state.default;
//     //   console.log('this.state.videoContext.video ', this.state.videoContext.video);
//     // } else {
//     //   const context = `${display}Context`;
//     //   const setting = `${display}VideoSettings`;
//     //   this.state[context].video = this.state[setting];
//     //   console.log('this.state[context].video ', this.state[context].video);
//     // }
//   }

//   // @debounce(200)
//   // updateHorizontalObsSettings() {
//   //   this.state.horizontalContext.video = this.state.horizontal;
//   // }

//   // @debounce(200)
//   // updateVerticalObsSettings() {
//   //   this.state.verticalContext.video = this.state.vertical;
//   // }

//   setVideoSetting(key: string, value: unknown, display?: string) {
//     this.SET_VIDEO_SETTING(key, value, display);
//     this.updateObsSettings(display ?? 'default');
//   }

//   @mutation()
//   SET_VIDEO_SETTING(key: string, value: unknown, display?: string) {
//     console.log('----------> DISPLAY ', display);
//     if (key === 'baseWidth') console.log('baseWidth ', key);
//     if (key === 'baseHeight') console.log('baseHeight ', key);
//     const propertyName = `${display ?? 'default'}VideoSettings`;
//     console.log('propertyName', propertyName);
//     this.state[propertyName] = {
//       ...this.state[propertyName],
//       [key]: value,
//     };
//   }
// }
