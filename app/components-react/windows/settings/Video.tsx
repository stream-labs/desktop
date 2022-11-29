import * as remote from '@electron/remote';
import React, { useState } from 'react';
import { useModule } from 'slap';
import { Services } from '../../service-provider';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import * as obs from '../../../../obs-api';
import { $t } from 'services/i18n';
import { Select } from 'antd';
import Tooltip from 'components-react/shared/Tooltip';
import styles from './Common.m.less';

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

  get values() {
    return this.service.videoSettingsValues;
  }

  get metadata() {
    return {
      baseRes: {
        type: 'autocomplete',
        label: $t('Base (Canvas) Resolution'),
        options: CANVAS_RES_OPTIONS.concat(this.monitorResolutions),
        rules: [this.resolutionValidator],
        onChange: (val: string) => this.setResolution('baseRes', val),
      },
      outputRes: {
        type: 'autocomplete',
        label: $t('Output (Scaled) Resolution'),
        options: OUTPUT_RES_OPTIONS,
        rules: [this.resolutionValidator],
        onChange: (val: string) => this.setResolution('outputRes', val),
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
            displayed: this.values.fpsType === obs.EFPSType.Integer,
          },
          fpsNum: {
            type: 'number',
            label: $t('FPS Numerator'),
            displayed: this.values.fpsType === obs.EFPSType.Fractional,
          },
          fpsDen: {
            type: 'number',
            label: $t('FPS Denominator'),
            displayed: this.values.fpsType === obs.EFPSType.Fractional,
          },
        },
      },
    };
  }

  get outputResOptions() {
    const baseRes = `${this.service.state.videoContext.baseWidth}x${this.service.state.videoContext.baseHeight}`;
    if (!OUTPUT_RES_OPTIONS.find(opt => opt.value === baseRes)) {
      return [{ label: baseRes, value: baseRes }].concat(OUTPUT_RES_OPTIONS);
    }
    return OUTPUT_RES_OPTIONS;
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

  get resolutionValidator() {
    return {
      message: $t('The resolution must be in the format [width]x[height] (i.e. 1920x1080)'),
      pattern: /^[0-9]+x[0-9]+$/,
    };
  }

  setResolution(key: string, value: string) {
    const [width, height] = value.split('x');
    const prefix = key === 'baseRes' ? 'base' : 'output';
    this.service.actions.setVideoSetting(`${prefix}Width`, Number(width));
    this.service.actions.setVideoSetting(`${prefix}Height`, Number(height));
  }

  setFPSType(value: obs.EFPSType) {
    this.service.actions.setVideoSetting('fpsType', value);
    this.service.actions.setVideoSetting('fpsNum', 30);
    this.service.actions.setVideoSetting('fpsDen', 1);
  }

  setCommonFPS(value: string) {
    const [fpsNum, fpsDen] = value.split('-');
    this.service.actions.setVideoSetting('fpsNum', Number(fpsNum));
    this.service.actions.setVideoSetting('fpsDen', Number(fpsDen));
  }

  setIntegerFPS(value: string) {
    this.service.actions.setVideoSetting('fpsNum', Number(value));
    this.service.actions.setVideoSetting('fpsDen', 1);
  }

  onChange(key: string) {
    return (val: unknown) => this.service.actions.setVideoSetting(key, val);
  }
}

export function VideoSettings() {
  const { values, metadata, onChange } = useModule(VideoSettingsModule);

  const [orientation, setOrientation] = useState('both');

  const orientationOptions = [
    {
      value: 'horizontal',
      label: $t('Horizontal'),
    },
    {
      value: 'vertical',
      label: $t('Vertical'),
    },
    {
      value: 'both',
      label: $t('Dual Output (Simultaneous Horizontal and Vertical Outputs)'),
    },
  ];

  return (
    <div className={styles.videoSettings}>
      <div className={styles.videoSettingsHeader}>
        <div className={styles.headingWrapper}>
          <h3>{$t('Video Output Orientation')}</h3>
          <Tooltip
            title={$t('Dual Output can be enabled in the Multistreaming settings tab.')}
            placement="right"
            lightShadow
          >
            <i className="icon-information" />
          </Tooltip>
        </div>

        <Select
          defaultValue="both"
          style={{ width: '100%' }}
          onChange={value => setOrientation(value)}
          options={orientationOptions}
        />
      </div>

      {['horizontal', 'both'].includes(orientation) && (
        <>
          <div className={styles.outputHeader}>
            <i className="icon-phone-case" />
            <h1>{$t('Horizontal Output')}</h1>
          </div>
          <div className={styles.formSection}>
            <FormFactory
              values={values}
              metadata={metadata}
              onChange={onChange}
              formOptions={{ layout: 'vertical' }}
            />
          </div>
        </>
      )}

      {['vertical', 'both'].includes(orientation) && (
        <>
          <div className={styles.outputHeader}>
            <i className="icon-desktop" />
            <h1>{$t('Vertical Output')}</h1>
          </div>
          <div className={styles.formSection}>
            <FormFactory
              values={values}
              metadata={metadata}
              onChange={onChange}
              formOptions={{ layout: 'vertical' }}
            />
          </div>
        </>
      )}
    </div>
  );
}

VideoSettings.page = 'Video';
