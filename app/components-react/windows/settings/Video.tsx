import * as remote from '@electron/remote';
import React from 'react';
import { useModule, injectState } from 'slap';
import { Services } from '../../service-provider';
import FormFactory, { TInputValue } from 'components-react/shared/inputs/FormFactory';
import * as obs from '../../../../obs-api';
import { $t } from 'services/i18n';
import styles from './Common.m.less';
import { invalidFps, TDisplayType } from 'services/settings-v2/video';

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

class VideoSettingsModule {
  service = Services.VideoSettingsService;

  get display(): TDisplayType {
    return this.state.display;
  }

  get values(): Dictionary<TInputValue> {
    const display = this.state.display;
    const vals = this.service.values[display];
    const baseRes = display !== 'green' && this.state?.customBaseRes ? 'custom' : vals.baseRes;
    const outputRes =
      display !== 'green' && this.state?.customOutputRes ? 'custom' : vals.outputRes;
    return {
      ...vals,
      baseRes,
      outputRes,
      customBaseRes: this.state.customBaseResValue,
      customOutputRes: this.state.customOutputResValue,
      fpsNum: this.state.fpsNum,
      fpsDen: this.state.fpsDen,
      fpsInt: this.state.fpsInt,
    };
  }

  state = injectState({
    display: 'horizontal' as TDisplayType,
    customBaseRes: !this.baseResOptions.find(
      opt => opt.value === this.service.values.horizontal.baseRes,
    ),
    customOutputRes: !this.outputResOptions.find(
      opt => opt.value === this.service.values.horizontal.outputRes,
    ),
    customBaseResValue: this.service.values.horizontal.baseRes,
    customOutputResValue: this.service.values.horizontal.outputRes,
    fpsNum: this.service.values.horizontal.fpsNum,
    fpsDen: this.service.values.horizontal.fpsDen,
    fpsInt: this.service.values.horizontal.fpsNum,
  });

  get metadata() {
    return {
      baseRes: {
        type: 'list',
        label: $t('Base (Canvas) Resolution'),
        options: this.baseResOptions,
        onChange: (val: string) => this.selectResolution('baseRes', val),
        children: {
          customBaseRes: {
            type: 'text',
            label: $t('Custom Base Resolution'),
            rules: [this.resolutionValidator],
            onChange: (val: string) => this.setResolution('baseRes', val),
            displayed: this.state.customBaseRes,
          },
        },
      },
      outputRes: {
        type: 'list',
        label: $t('Output (Scaled) Resolution'),
        options: this.outputResOptions,
        onChange: (val: string) => this.selectResolution('outputRes', val),
        children: {
          customOutputRes: {
            type: 'text',
            label: $t('Custom Output Resolution'),
            rules: [this.resolutionValidator],
            onChange: (val: string) => this.setResolution('outputRes', val),
            displayed: this.state.customOutputRes,
          },
        },
      },
      scaleType: {
        type: 'list',
        label: $t('Downscale Filter'),
        options: [
          {
            label: $t('Bilinear (Fastest, but blurry if scaling)'),
            value: obs.EScaleType.Bilinear,
          },
          { label: $t('Bicubic (Sharpened scaling, 16 samples)'), value: obs.EScaleType.Bicubic },
          { label: $t('Lanczos (Sharpened scaling, 32 samples)'), value: obs.EScaleType.Lanczos },
        ],
      },
      fpsType: {
        type: 'list',
        label: $t('FPS Type'),
        onChange: (val: obs.EFPSType) => this.setFPSType(val),
        options: [
          { label: $t('Common FPS Values'), value: obs.EFPSType.Common },
          { label: $t('Integer FPS Values'), value: obs.EFPSType.Integer },
          { label: $t('Fractional FPS Values'), value: obs.EFPSType.Fractional },
        ],

        children: {
          fpsCom: {
            type: 'list',
            label: $t('Common FPS Values'),
            options: FPS_OPTIONS,
            onChange: (val: string) => this.setCommonFPS(val),
            displayed: this.values.fpsType === obs.EFPSType.Common,
          },
          fpsInt: {
            type: 'number',
            label: $t('FPS Value'),
            onChange: (val: string) => this.setIntegerFPS(val),
            rules: [{ max: 1000, min: 1, message: $t('FPS Value must be between 1 and 1000') }],
            displayed: this.values.fpsType === obs.EFPSType.Integer,
          },
          fpsNum: {
            type: 'number',
            label: $t('FPS Numerator'),
            onChange: (val: string) => this.setFPS('fpsNum', val),
            rules: [
              { validator: this.fpsNumValidator.bind(this) },
              {
                min: 1,
                message: $t('%{fieldName} must be greater than 0', {
                  fieldName: $t('FPS Numerator'),
                }),
              },
            ],
            displayed: this.values.fpsType === obs.EFPSType.Fractional,
          },
          fpsDen: {
            type: 'number',
            label: $t('FPS Denominator'),
            onChange: (val: string) => this.setFPS('fpsDen', val),
            rules: [
              { validator: this.fpsDenValidator.bind(this) },
              {
                min: 1,
                message: $t('%{fieldName} must be greater than 0', {
                  fieldName: $t('FPS Denominator'),
                }),
              },
            ],
            displayed: this.values.fpsType === obs.EFPSType.Fractional,
          },
        },
      },
    };
  }

  get baseResOptions() {
    return CANVAS_RES_OPTIONS.concat(this.monitorResolutions).concat([
      { label: $t('Custom'), value: 'custom' },
    ]);
  }

  get outputResOptions() {
    const baseRes = `${this.service.state.horizontal.baseWidth}x${this.service.state.horizontal.baseHeight}`;
    if (!OUTPUT_RES_OPTIONS.find(opt => opt.value === baseRes)) {
      return [{ label: baseRes, value: baseRes }]
        .concat(OUTPUT_RES_OPTIONS)
        .concat([{ label: $t('Custom'), value: 'custom' }]);
    }
    return OUTPUT_RES_OPTIONS.concat([{ label: $t('Custom'), value: 'custom' }]);
  }

  get monitorResolutions() {
    const resOptions: { label: string; value: string }[] = [];
    const displays = remote.screen.getAllDisplays();
    displays.forEach(display => {
      const size = display.size;
      const res = `${size.width}x${size.height}`;
      if (
        !resOptions.find(opt => opt.value === res) &&
        !CANVAS_RES_OPTIONS.find(opt => opt.value === res)
      ) {
        resOptions.push({ label: res, value: res });
      }
    });
    return resOptions;
  }

  get resolutionValidator() {
    return {
      message: $t('The resolution must be in the format [width]x[height] (i.e. 1920x1080)'),
      pattern: /^[0-9]+x[0-9]+$/,
    };
  }

  fpsNumValidator(rule: unknown, value: string, callback: Function) {
    if (Number(value) / Number(this.values.fpsDen) > 1000) {
      callback(
        $t(
          'This number is too large for a FPS Denominator of %{fpsDen}, please decrease it or increase the Denominator',
          { fpsDen: this.values.fpsDen },
        ),
      );
    } else {
      callback();
    }
  }

  fpsDenValidator(rule: unknown, value: string, callback: Function) {
    if (Number(this.values.fpsNum) / Number(value) < 1) {
      callback(
        $t(
          'This number is too large for a FPS Numerator of %{fpsNum}, please decrease it or increase the Numerator',
          { fpsNum: this.values.fpsNum },
        ),
      );
    } else {
      callback();
    }
  }

  setResolution(key: string, value: string) {
    const display = this.state.display;
    if (key === 'outputRes') {
      this.state.setCustomOutputResValue(value);
    } else if (key === 'baseRes') {
      this.state.setCustomBaseResValue(value);
    }

    if (this.resolutionValidator.pattern.test(value)) {
      const [width, height] = value.split('x');
      const prefix = key === 'baseRes' ? 'base' : 'output';
      this.service.actions.setVideoSetting(`${prefix}Width`, Number(width), display);
      this.service.actions.setVideoSetting(`${prefix}Height`, Number(height), display);
    }
  }

  selectResolution(key: string, value: string) {
    if (value === 'custom') {
      this.setCustomResolution(key, true);
      this.setResolution(key, '');
    } else {
      this.setCustomResolution(key, false);
      this.setResolution(key, value);
    }
  }

  setCustomResolution(key: string, value: boolean) {
    if (key === 'baseRes') {
      this.state.setCustomBaseRes(value);
    } else {
      this.state.setCustomOutputRes(value);
    }
  }

  setFPSType(value: obs.EFPSType) {
    const display = this.state.display;
    this.service.actions.setVideoSetting('fpsType', value, display);
    this.service.actions.setVideoSetting('fpsNum', 30, display);
    this.service.actions.setVideoSetting('fpsDen', 1, display);
  }

  setCommonFPS(value: string) {
    const display = this.state.display;
    const [fpsNum, fpsDen] = value.split('-');
    this.service.actions.setVideoSetting('fpsNum', Number(fpsNum), display);
    this.service.actions.setVideoSetting('fpsDen', Number(fpsDen), display);
  }

  setIntegerFPS(value: string) {
    const display = this.state.display;
    this.state.setFpsInt(Number(value));
    if (Number(value) > 0 && Number(value) < 1001) {
      this.service.actions.setVideoSetting('fpsNum', Number(value), display);
      this.service.actions.setVideoSetting('fpsDen', 1, display);
    }
  }

  setFPS(key: 'fpsNum' | 'fpsDen', value: string) {
    const display = this.state.display;
    if (key === 'fpsNum') {
      this.state.setFpsNum(Number(value));
    } else {
      this.state.setFpsDen(Number(value));
    }

    if (!invalidFps(this.state.fpsNum, this.state.fpsDen) && Number(value) > 0) {
      this.service.actions.setVideoSetting(key, Number(value), display);
    }
  }

  onChange(key: string) {
    return (val: unknown) => this.service.actions.setVideoSetting(key, val, this.state.display);
  }

  setDisplay(display: TDisplayType) {
    this.state.setDisplay(display);

    const customBaseRes = !this.baseResOptions.find(
      opt => opt.value === this.service.values[display].baseRes,
    );
    const customOutputRes = !this.outputResOptions.find(
      opt => opt.value === this.service.values[display].outputRes,
    );
    this.state.setCustomBaseRes(customBaseRes);
    this.state.setCustomOutputRes(customOutputRes);
    this.state.setCustomBaseResValue(this.service.values[display].baseRes);
    this.state.setCustomOutputResValue(this.service.values[display].outputRes);
    this.state.setFpsNum(this.service.values[display].fpsNum);
    this.state.setFpsDen(this.service.values[display].fpsDen);
    this.state.setFpsInt(this.service.values[display].fpsInt);
  }
}

export function VideoSettings() {
  const { values, metadata, onChange } = useModule(VideoSettingsModule);

  return (
    <>
      <h2>{$t('Video')}</h2>

      <div className={styles.formSection}>
        <FormFactory
          values={values}
          metadata={metadata}
          onChange={onChange}
          formOptions={{ layout: 'vertical' }}
          name="video-settings"
        />
      </div>
    </>
  );
}

VideoSettings.page = 'Video';
