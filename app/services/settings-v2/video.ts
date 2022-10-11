import { Inject } from 'services/core/injector';
import * as remote from '@electron/remote';
import { InitAfter } from 'services/core';
import { mutation, StatefulService } from '../core/stateful-service';
import * as obs from '../../../obs-api';
import { SettingsManagerService } from 'services/settings-manager';
import { $t } from 'services/i18n';
import { metadata } from 'components-react/shared/inputs/metadata';

// export interface IVideo {
//   fpsNum: number;
//   fpsDen: number;
//   baseWidth: number;
//   baseHeight: number;
//   outputWidth: number;
//   outputHeight: number;
//   outputFormat: EVideoFormat;
//   colorspace: EColorSpace;
//   range: ERangeType;
//   scaleType: EScaleType;
//   fpsType: EFPSType;
// }

const CANVAS_RES_OPTIONS = [
  { label: '1920x1080', value: '1920x1080' },
  { label: '1280x720', value: '1280x720' },
];

const OUTPUT_RES_OPTIONS = [
  { label: '1920x1080', value: '1920x1080' },
  { label: '1536x864', value: '1536x864' },
  { label: '1440x810', value: '1440x810' },
  { label: '1280x720', value: '1280x720' },
  { label: '1152x648', value: '1152x648' },
  { label: '1096x616', value: '1096x616' },
  { label: '960x540', value: '960x540' },
  { label: '852x480', value: '852x480' },
  { label: '768x432', value: '768x432' },
  { label: '698x392', value: '698x392' },
  { label: '640x360', value: '640x360' },
];

const FPS_OPTIONS = [
  { label: '10', value: '10-1' },
  { label: '20', value: '20-1' },
  { label: '24 NTSC', value: '24000-1001' },
  { label: '25', value: '25-1' },
  { label: '29.97', value: '30000-1001' },
  { label: '30', value: '30-1' },
  { label: '48', value: '48-1' },
  { label: '59.94', value: '60000-1001' },
  { label: '60', value: '60-1' },
];

@InitAfter('UserService')
export class VideoSettingsService extends StatefulService<{ videoContext: obs.IVideo }> {
  @Inject() settingsManagerService: SettingsManagerService;

  initialState = {
    videoContext: null as obs.IVideo,
  };

  init() {
    this.establishVideoContext();
  }

  get videoSettingsMetadata() {
    return {
      baseRes: metadata.autocomplete({
        label: $t('Base (Canvas) Resolution'),
        options: CANVAS_RES_OPTIONS.concat(this.monitorResolutions),
        rules: [this.resolutionValidator],
        onChange: (val: string) => this.setResolution('baseRes', val),
      }),
      outputRes: metadata.autocomplete({
        label: $t('Output (Scaled) Resolution'),
        options: OUTPUT_RES_OPTIONS,
        rules: [this.resolutionValidator],
        onChange: (val: string) => this.setResolution('outputRes', val),
      }),
      scaleType: metadata.list({
        label: $t('Downscale Filter'),
        options: [
          {
            label: $t('Bilinear (Fastest, but blurry if scaling)'),
            value: obs.EScaleType.Bilinear,
          },
          { label: $t('Bicubic (Sharpened scaling, 16 samples)'), value: obs.EScaleType.Bicubic },
          { label: $t('Lanczos (Sharpened scaling, 32 samples)'), value: obs.EScaleType.Lanczos },
        ],
      }),
      fpsType: metadata.list({
        label: $t('FPS Type'),
        options: [
          { label: $t('Common FPS Values'), value: obs.EFPSType.Common },
          { label: $t('Integer FPS Values'), value: obs.EFPSType.Integer },
          { label: $t('Fractional FPS Values'), value: obs.EFPSType.Fractional },
        ],

        children: {
          fpsCom: metadata.list({
            label: $t('Common FPS Values'),
            options: FPS_OPTIONS,
            onChange: (val: string) => this.setCommonFPS(val),
            displayed: this.videoSettingsValues.fpsType === obs.EFPSType.Common,
          }),
          fpsNum: metadata.number({
            label: $t('FPS Number'),
            displayed: [obs.EFPSType.Integer, obs.EFPSType.Fractional].includes(
              this.videoSettingsValues.fpsType,
            ),
          }),
          fpsDen: metadata.number({
            label: $t('FPS Density'),
            displayed: this.videoSettingsValues.fpsType === obs.EFPSType.Fractional,
          }),
        },
      }),
    };
  }

  get videoSettingsValues() {
    const context = this.state.videoContext;
    return {
      baseRes: `${context.baseWidth}x${context.baseHeight}`,
      outputRes: `${context.outputWidth}x${context.outputHeight}`,
      scaleType: context.scaleType,
      fpsType: context.fpsType,
      fpsNum: context.fpsNum,
      fpsDen: context.fpsDen,
    };
  }

  get videoSettings() {
    return this.settingsManagerService.videoSettings;
  }

  get monitorResolutions() {
    const resOptions: { label: string; value: string }[] = [];
    const displays = remote.screen.getAllDisplays();
    displays.forEach(display => {
      const size = display.size;
      const res = `${size.width}x${size.height}`;
      if (!resOptions.find(opt => opt.value === res)) resOptions.push({ label: res, value: res });
    });
    return resOptions;
  }

  migrateSettings() {
    Object.keys(this.videoSettings).forEach(
      (key: keyof obs.IAdvancedStreaming | keyof obs.ISimpleStreaming) => {
        this.SET_VIDEO_SETTING(key, this.videoSettings[key]);
      },
    );
  }

  establishVideoContext() {
    if (this.state.videoContext) return;

    this.SET_VIDEO_CONTEXT();

    this.migrateSettings();
    obs.VideoFactory.videoContext = this.state.videoContext;
  }

  get resolutionValidator() {
    return {
      message: $t('The resolution must be in the format [width]x[height] (i.e. 1920x1080)'),
      pattern: /^[0-9]+x[0-9]+$/,
    };
  }

  setVideoSetting(key: string, value: unknown) {
    this.SET_VIDEO_SETTING(key, value);
  }

  setResolution(key: string, value: string) {
    const [width, height] = value.split('x').map(val => Number(val));
    const prefix = key === 'baseRes' ? 'base' : 'output';
    this.SET_VIDEO_SETTING(`${prefix}Width`, width);
    this.SET_VIDEO_SETTING(`${prefix}Height`, height);
  }

  setCommonFPS(value: string) {
    const [fpsNum, fpsDen] = value.split('-');
    this.SET_VIDEO_SETTING('fpsNum', fpsNum);
    this.SET_VIDEO_SETTING('fpsDen', fpsDen);
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
