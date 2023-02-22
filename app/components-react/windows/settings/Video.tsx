import * as remote from '@electron/remote';
import React, { useState } from 'react';
import { useModule, injectState } from 'slap';
import { useVuex } from 'components-react/hooks';
import { Services } from '../../service-provider';
import FormFactory, { TInputValue } from 'components-react/shared/inputs/FormFactory';
import * as obs from '../../../../obs-api';
import { $t } from 'services/i18n';
import { Tabs } from 'antd';
import { RadioInput } from 'components-react/shared/inputs';
import Tooltip from 'components-react/shared/Tooltip';
import styles from './Common.m.less';
import { TDisplayType, invalidFps } from 'services/settings-v2/video';

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

  state = injectState({
    customBaseRes: !this.baseResOptions.find(
      opt => opt.value === this.service.horizontalSettingsValues.baseRes,
    ),
    customOutputRes: !this.outputResOptions.find(
      opt => opt.value === this.service.horizontalSettingsValues.outputRes,
    ),
    customBaseResValue: this.service.horizontalSettingsValues.baseRes,
    customOutputResValue: this.service.horizontalSettingsValues.outputRes,
    fpsNum: this.service.horizontalSettingsValues.fpsNum,
    fpsDen: this.service.horizontalSettingsValues.fpsDen,
    fpsInt: this.service.horizontalSettingsValues.fpsNum,
  });

  get values(): Dictionary<TInputValue> {
    const vals = this.service.horizontalSettingsValues;
    const baseRes = this.state?.customBaseRes ? 'custom' : vals.baseRes;
    const outputRes = this.state?.customOutputRes ? 'custom' : vals.outputRes;
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

  get horizontalValues() {
    return this.service.horizontalSettingsValues;
  }

  get verticalValues() {
    return this.service.verticalSettingsValues;
  }

  get metadata() {
    return this.formatMetadata('default');
  }

  get horizontalMetadata() {
    return this.formatMetadata('horizontal');
  }

  get verticalMetadata() {
    return this.formatMetadata('vertical');
  }

  // @@@ TODO: add formatMetadata for dual output settings separate from single display settings
  // get dualOutputMetadata() {
  //   return this.formatMetadata('vertical');
  // }

  formatMetadata(display: TDisplayType) {
    return {
      baseRes: {
        type: 'autocomplete',
        label: $t('Base (Canvas) Resolution'),
        options: this.baseResOptions,
        onChange: (val: string) => this.selectResolution('baseRes', val, display),
        children: {
          customBaseRes: {
            type: 'text',
            label: $t('Custom Base Resolution'),
            rules: [this.resolutionValidator],
            onChange: (val: string) => this.setResolution('baseRes', val, display),
            displayed: this.state.customBaseRes,
          },
        },
      },
      outputRes: {
        type: 'autocomplete',
        label: $t('Output (Scaled) Resolution'),
        options: this.outputResOptions,
        onChange: (val: string) => this.selectResolution('outputRes', val, display),
        children: {
          customOutputRes: {
            type: 'text',
            label: $t('Custom Output Resolution'),
            rules: [this.resolutionValidator],
            onChange: (val: string) => this.setResolution('outputRes', val, display),
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
        onChange: (val: obs.EFPSType) => this.setFPSType(val, display),
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
            onChange: (val: string) => this.setCommonFPS(val, display),
            displayed: this.values.fpsType === obs.EFPSType.Common,
          },
          fpsInt: {
            type: 'number',
            label: $t('FPS Value'),
            onChange: (val: string) => this.setIntegerFPS(val, display),
            rules: [{ max: 1000, min: 1, message: $t('FPS Value must be between 1 and 1000') }],
            displayed: this.values.fpsType === obs.EFPSType.Integer,
          },
          fpsNum: {
            type: 'number',
            label: $t('FPS Numerator'),
            onChange: (val: string) => this.setFPS('fpsNum', val, display),
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
            onChange: (val: string) => this.setFPS('fpsDen', val, display),
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

  selectResolution(key: string, value: string, display: TDisplayType) {
    if (value === 'custom') {
      this.setCustomResolution(key, true);
      this.setResolution(key, '', display);
    } else {
      this.setCustomResolution(key, false);
      this.setResolution(key, value, display);
    }
  }

  setResolution(key: string, value: string, display: TDisplayType) {
    const [width, height] = value.split('x');
    const prefix = key === 'baseRes' ? 'base' : 'output';
    this.service.actions.setVideoSetting(`${prefix}Width`, Number(width), display);
    this.service.actions.setVideoSetting(`${prefix}Height`, Number(height), display);
  }

  setCustomResolution(key: string, value: boolean) {
    if (key === 'baseRes') {
      this.state.setCustomBaseRes(value);
    } else {
      this.state.setCustomOutputRes(value);
    }
  }

  setFPSType(value: obs.EFPSType, display: TDisplayType) {
    this.service.actions.setVideoSetting('fpsType', value, display);
    this.service.actions.setVideoSetting('fpsNum', 30, display);
    this.service.actions.setVideoSetting('fpsDen', 1, display);
  }

  setCommonFPS(value: string, display: TDisplayType) {
    const [fpsNum, fpsDen] = value.split('-');
    this.service.actions.setVideoSetting('fpsNum', Number(fpsNum), display);
    this.service.actions.setVideoSetting('fpsDen', Number(fpsDen), display);
  }

  setIntegerFPS(value: string, display: TDisplayType) {
    this.state.setFpsInt(Number(value));
    if (Number(value) > 0 && Number(value) < 1001) {
      this.service.actions.setVideoSetting('fpsNum', Number(value), display);
      this.service.actions.setVideoSetting('fpsDen', 1, display);
    }
  }

  setFPS(key: 'fpsNum' | 'fpsDen', value: string, display: TDisplayType) {
    if (key === 'fpsNum') {
      this.state.setFpsNum(Number(value));
    } else {
      this.state.setFpsDen(Number(value));
    }

    if (!invalidFps(this.state.fpsNum, this.state.fpsDen) && Number(value) > 0) {
      this.service.actions.setVideoSetting(key, Number(value), display);
    }
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

  onChange(key: string, display: TDisplayType) {
    return (val: unknown) => this.service.actions.setVideoSetting(key, val, display);
  }
}

export function VideoSettings() {
  const {
    values,
    horizontalValues,
    verticalValues,
    metadata,
    horizontalMetadata,
    verticalMetadata,
    onChange,
  } = useModule(VideoSettingsModule);

  const v = useVuex(() => ({
    defaultDisplay: Services.SettingsManagerService.views.videoSettings.defaultVideoSetting,
    setDefaultDisplay: Services.SettingsManagerService.setDefaultDisplay,
  }));

  const orientationOptions = [
    {
      value: 'horizontal',
      label: $t('Horizontal'),
    },
    {
      value: 'vertical',
      label: $t('Vertical'),
    },
  ];

  return (
    <div className={styles.videoSettings}>
      <div className={styles.videoSettingsHeader}>
        <div className={styles.headingWrapper}>
          <h3>{$t('Video Output Orientation')}</h3>
          <Tooltip
            title={$t('Dual Output can be enabled in the Editor.')}
            placement="right"
            lightShadow
          >
            <i className="icon-information" />
          </Tooltip>
        </div>

        <RadioInput
          label={$t('Select default display orientation:') as string}
          direction="horizontal"
          nolabel
          nomargin
          defaultValue={v.defaultDisplay}
          options={orientationOptions}
          onChange={val => v.setDefaultDisplay(val as TDisplayType)}
          value={v.defaultDisplay}
        />
      </div>

      <Tabs defaultActiveKey={v.defaultDisplay}>
        <Tabs.TabPane tab={$t('Horizontal')} key="horizontal">
          <div className={styles.outputHeader}>
            <i className="icon-phone-case" />
            <h1>{$t('Horizontal Output')}</h1>
          </div>
          <div className={styles.formSection}>
            <FormFactory
              values={horizontalValues}
              metadata={horizontalMetadata}
              onChange={val => onChange(val, 'horizontal')}
              formOptions={{ layout: 'vertical' }}
            />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab={$t('Vertical')} key="vertical">
          <div className={styles.outputHeader}>
            <i className="icon-desktop" />
            <h1>{$t('Vertical Output')}</h1>
          </div>
          <div className={styles.formSection}>
            <FormFactory
              values={verticalValues}
              metadata={verticalMetadata}
              onChange={val => onChange(val, 'vertical')}
              formOptions={{ layout: 'vertical' }}
            />
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

VideoSettings.page = 'Video';

/**
 * @@@ The below is the original code from 01/05 merge master into branch
 *     that was refactored.
 *     TODO: remove comment once functionality confirmed
 */
// <<<<<<< HEAD
//   setIntegerFPS(value: string, display: TDisplayType) {
//     this.service.actions.setVideoSetting('fpsNum', Number(value), display);
//     this.service.actions.setVideoSetting('fpsDen', 1, display);
// =======
//   setIntegerFPS(value: string) {
//     this.state.setFpsInt(Number(value));
//     if (Number(value) > 0 && Number(value) < 1001) {
//       this.service.actions.setVideoSetting('fpsNum', Number(value));
//       this.service.actions.setVideoSetting('fpsDen', 1);
//     }
//   }

//   setFPS(key: 'fpsNum' | 'fpsDen', value: string) {
//     if (key === 'fpsNum') {
//       this.state.setFpsNum(Number(value));
//     } else {
//       this.state.setFpsDen(Number(value));
//     }

//     if (!invalidFps(this.state.fpsNum, this.state.fpsDen) && Number(value) > 0) {
//       this.service.actions.setVideoSetting(key, Number(value));
//     }
// >>>>>>> master
// }

/**
 * @@@ The below is the original code from 01/05 merge master into branch
 *     that was refactored.
 *     TODO: remove comment once functionality confirmed
 */

// <<<<<<< HEAD
//   formatMetadata(display: TDisplayType) {
//     return {
//       baseRes: {
//         type: 'autocomplete',
//         label: $t('Base (Canvas) Resolution'),
//         options: CANVAS_RES_OPTIONS.concat(this.monitorResolutions),
//         rules: [this.resolutionValidator],
//         onChange: (val: string) => this.setResolution('baseRes', val, display),
//       },
//       outputRes: {
//         type: 'autocomplete',
//         label: $t('Output (Scaled) Resolution'),
//         options: OUTPUT_RES_OPTIONS,
//         rules: [this.resolutionValidator],
//         onChange: (val: string) => this.setResolution('outputRes', val, display),
//       },
//       scaleType: {
//         type: 'list',
//         label: $t('Downscale Filter'),
//         options: [
//           {
//             label: $t('Bilinear (Fastest, but blurry if scaling)'),
//             value: obs.EScaleType.Bilinear,
//           },
//           { label: $t('Bicubic (Sharpened scaling, 16 samples)'), value: obs.EScaleType.Bicubic },
//           { label: $t('Lanczos (Sharpened scaling, 32 samples)'), value: obs.EScaleType.Lanczos },
//         ],
//       },
//       fpsType: {
//         type: 'list',
//         label: $t('FPS Type'),
//         onChange: (val: obs.EFPSType) => this.setFPSType(val, display),
//         options: [
//           { label: $t('Common FPS Values'), value: obs.EFPSType.Common },
//           { label: $t('Integer FPS Values'), value: obs.EFPSType.Integer },
//           { label: $t('Fractional FPS Values'), value: obs.EFPSType.Fractional },
//         ],

//         children: {
//           fpsCom: {
//             type: 'list',
//             label: $t('Common FPS Values'),
//             options: FPS_OPTIONS,
//             onChange: (val: string) => this.setCommonFPS(val, display),
//             displayed: this.values.fpsType === obs.EFPSType.Common,
//           },
//           fpsInt: {
//             type: 'number',
//             label: $t('FPS Value'),
//             onChange: (val: string) => this.setIntegerFPS(val, display),
//             displayed: this.values.fpsType === obs.EFPSType.Integer,
//           },
//           fpsNum: {
//             type: 'number',
//             label: $t('FPS Numerator'),
//             displayed: this.values.fpsType === obs.EFPSType.Fractional,
//           },
//           fpsDen: {
//             type: 'number',
//             label: $t('FPS Denominator'),
//             displayed: this.values.fpsType === obs.EFPSType.Fractional,
//           },
//         },
//       },
//     };
//   }

//   setResolution(key: string, value: string, display: TDisplayType) {
//     const [width, height] = value.split('x');
//     const prefix = key === 'baseRes' ? 'base' : 'output';
//     this.service.actions.setVideoSetting(`${prefix}Width`, Number(width), display);
//     this.service.actions.setVideoSetting(`${prefix}Height`, Number(height), display);
// =======
// get metadata() {
//   return {
//     baseRes: {
//       type: 'list',
//       label: $t('Base (Canvas) Resolution'),
//       options: this.baseResOptions,
//       onChange: (val: string) => this.selectResolution('baseRes', val),
//       children: {
//         customBaseRes: {
//           type: 'text',
//           label: $t('Custom Base Resolution'),
//           rules: [this.resolutionValidator],
//           onChange: (val: string) => this.setResolution('baseRes', val),
//           displayed: this.state.customBaseRes,
//         },
//       },
//     },
//     outputRes: {
//       type: 'list',
//       label: $t('Output (Scaled) Resolution'),
//       options: this.outputResOptions,
//       onChange: (val: string) => this.selectResolution('outputRes', val),
//       children: {
//         customOutputRes: {
//           type: 'text',
//           label: $t('Custom Output Resolution'),
//           rules: [this.resolutionValidator],
//           onChange: (val: string) => this.setResolution('outputRes', val),
//           displayed: this.state.customOutputRes,
//         },
//       },
//     },
//     scaleType: {
//       type: 'list',
//       label: $t('Downscale Filter'),
//       options: [
//         {
//           label: $t('Bilinear (Fastest, but blurry if scaling)'),
//           value: obs.EScaleType.Bilinear,
//         },
//         { label: $t('Bicubic (Sharpened scaling, 16 samples)'), value: obs.EScaleType.Bicubic },
//         { label: $t('Lanczos (Sharpened scaling, 32 samples)'), value: obs.EScaleType.Lanczos },
//       ],
//     },
//     fpsType: {
//       type: 'list',
//       label: $t('FPS Type'),
//       onChange: (val: obs.EFPSType) => this.setFPSType(val),
//       options: [
//         { label: $t('Common FPS Values'), value: obs.EFPSType.Common },
//         { label: $t('Integer FPS Values'), value: obs.EFPSType.Integer },
//         { label: $t('Fractional FPS Values'), value: obs.EFPSType.Fractional },
//       ],

//       children: {
//         fpsCom: {
//           type: 'list',
//           label: $t('Common FPS Values'),
//           options: FPS_OPTIONS,
//           onChange: (val: string) => this.setCommonFPS(val),
//           displayed: this.values.fpsType === obs.EFPSType.Common,
//         },
//         fpsInt: {
//           type: 'number',
//           label: $t('FPS Value'),
//           onChange: (val: string) => this.setIntegerFPS(val),
//           rules: [{ max: 1000, min: 1, message: $t('FPS Value must be between 1 and 1000') }],
//           displayed: this.values.fpsType === obs.EFPSType.Integer,
//         },
//         fpsNum: {
//           type: 'number',
//           label: $t('FPS Numerator'),
//           onChange: (val: string) => this.setFPS('fpsNum', val),
//           rules: [
//             { validator: this.fpsNumValidator.bind(this) },
//             {
//               min: 1,
//               message: $t('%{fieldName} must be greater than 0', {
//                 fieldName: $t('FPS Numerator'),
//               }),
//             },
//           ],
//           displayed: this.values.fpsType === obs.EFPSType.Fractional,
//         },
//         fpsDen: {
//           type: 'number',
//           label: $t('FPS Denominator'),
//           onChange: (val: string) => this.setFPS('fpsDen', val),
//           rules: [
//             { validator: this.fpsDenValidator.bind(this) },
//             {
//               min: 1,
//               message: $t('%{fieldName} must be greater than 0', {
//                 fieldName: $t('FPS Denominator'),
//               }),
//             },
//           ],
//           displayed: this.values.fpsType === obs.EFPSType.Fractional,
//         },
//       },
//     },
//   };

//   fpsNumValidator(rule: unknown, value: string, callback: Function) {
//     if (Number(value) / Number(this.values.fpsDen) > 1000) {
//       callback(
//         $t(
//           'This number is too large for a FPS Denominator of %{fpsDen}, please decrease it or increase the Denominator',
//           { fpsDen: this.values.fpsDen },
//         ),
//       );
//     } else {
//       callback();
//     }
//   }

//   fpsDenValidator(rule: unknown, value: string, callback: Function) {
//     if (Number(this.values.fpsNum) / Number(value) < 1) {
//       callback(
//         $t(
//           'This number is too large for a FPS Numerator of %{fpsNum}, please decrease it or increase the Numerator',
//           { fpsNum: this.values.fpsNum },
//         ),
//       );
//     } else {
//       callback();
//     }
//   }

//   setResolution(key: string, value: string) {
//     if (key === 'outputRes') {
//       this.state.setCustomOutputResValue(value);
//     } else if (key === 'baseRes') {
//       this.state.setCustomBaseResValue(value);
//     }

//     if (this.resolutionValidator.pattern.test(value)) {
//       const [width, height] = value.split('x');
//       const prefix = key === 'baseRes' ? 'base' : 'output';
//       this.service.actions.setVideoSetting(`${prefix}Width`, Number(width));
//       this.service.actions.setVideoSetting(`${prefix}Height`, Number(height));
//     }
//   }

//   selectResolution(key: string, value: string) {
//     if (value === 'custom') {
//       this.setCustomResolution(key, true);
//       this.setResolution(key, '');
//     } else {
//       this.setCustomResolution(key, false);
//       this.setResolution(key, value);
//     }
//   }

//   setCustomResolution(key: string, value: boolean) {
//     if (key === 'baseRes') {
//       this.state.setCustomBaseRes(value);
//     } else {
//       this.state.setCustomOutputRes(value);
//     }
//   }
// >>>>>>> master

/**
 * @@@ The below is the original code from 01/05 merge master into branch
 *     that was refactored.
 *     TODO: remove comment once functionality confirmed
 */

//   <<<<<<< HEAD
//   formatMetadata(display: TDisplayType) {
//     return {
//       baseRes: {
//         type: 'autocomplete',
//         label: $t('Base (Canvas) Resolution'),
//         options: CANVAS_RES_OPTIONS.concat(this.monitorResolutions),
//         rules: [this.resolutionValidator],
//         onChange: (val: string) => this.setResolution('baseRes', val, display),
//       },
//       outputRes: {
//         type: 'autocomplete',
//         label: $t('Output (Scaled) Resolution'),
//         options: OUTPUT_RES_OPTIONS,
//         rules: [this.resolutionValidator],
//         onChange: (val: string) => this.setResolution('outputRes', val, display),
//       },
//       scaleType: {
//         type: 'list',
//         label: $t('Downscale Filter'),
//         options: [
//           {
//             label: $t('Bilinear (Fastest, but blurry if scaling)'),
//             value: obs.EScaleType.Bilinear,
//           },
//           { label: $t('Bicubic (Sharpened scaling, 16 samples)'), value: obs.EScaleType.Bicubic },
//           { label: $t('Lanczos (Sharpened scaling, 32 samples)'), value: obs.EScaleType.Lanczos },
//         ],
//       },
//       fpsType: {
//         type: 'list',
//         label: $t('FPS Type'),
//         onChange: (val: obs.EFPSType) => this.setFPSType(val, display),
//         options: [
//           { label: $t('Common FPS Values'), value: obs.EFPSType.Common },
//           { label: $t('Integer FPS Values'), value: obs.EFPSType.Integer },
//           { label: $t('Fractional FPS Values'), value: obs.EFPSType.Fractional },
//         ],

//         children: {
//           fpsCom: {
//             type: 'list',
//             label: $t('Common FPS Values'),
//             options: FPS_OPTIONS,
//             onChange: (val: string) => this.setCommonFPS(val, display),
//             displayed: this.values.fpsType === obs.EFPSType.Common,
//           },
//           fpsInt: {
//             type: 'number',
//             label: $t('FPS Value'),
//             onChange: (val: string) => this.setIntegerFPS(val, display),
//             displayed: this.values.fpsType === obs.EFPSType.Integer,
//           },
//           fpsNum: {
//             type: 'number',
//             label: $t('FPS Numerator'),
//             displayed: this.values.fpsType === obs.EFPSType.Fractional,
//           },
//           fpsDen: {
//             type: 'number',
//             label: $t('FPS Denominator'),
//             displayed: this.values.fpsType === obs.EFPSType.Fractional,
//           },
//         },
//       },
//     };
//   }

//   setResolution(key: string, value: string, display: TDisplayType) {
//     const [width, height] = value.split('x');
//     const prefix = key === 'baseRes' ? 'base' : 'output';
//     this.service.actions.setVideoSetting(`${prefix}Width`, Number(width), display);
//     this.service.actions.setVideoSetting(`${prefix}Height`, Number(height), display);
// =======
//   fpsNumValidator(rule: unknown, value: string, callback: Function) {
//     if (Number(value) / Number(this.values.fpsDen) > 1000) {
//       callback(
//         $t(
//           'This number is too large for a FPS Denominator of %{fpsDen}, please decrease it or increase the Denominator',
//           { fpsDen: this.values.fpsDen },
//         ),
//       );
//     } else {
//       callback();
//     }
//   }

//   fpsDenValidator(rule: unknown, value: string, callback: Function) {
//     if (Number(this.values.fpsNum) / Number(value) < 1) {
//       callback(
//         $t(
//           'This number is too large for a FPS Numerator of %{fpsNum}, please decrease it or increase the Numerator',
//           { fpsNum: this.values.fpsNum },
//         ),
//       );
//     } else {
//       callback();
//     }
//   }

//   setResolution(key: string, value: string) {
//     if (key === 'outputRes') {
//       this.state.setCustomOutputResValue(value);
//     } else if (key === 'baseRes') {
//       this.state.setCustomBaseResValue(value);
//     }

//     if (this.resolutionValidator.pattern.test(value)) {
//       const [width, height] = value.split('x');
//       const prefix = key === 'baseRes' ? 'base' : 'output';
//       this.service.actions.setVideoSetting(`${prefix}Width`, Number(width));
//       this.service.actions.setVideoSetting(`${prefix}Height`, Number(height));
//     }
//   }

//   selectResolution(key: string, value: string) {
//     if (value === 'custom') {
//       this.setCustomResolution(key, true);
//       this.setResolution(key, '');
//     } else {
//       this.setCustomResolution(key, false);
//       this.setResolution(key, value);
//     }
//   }

//   setCustomResolution(key: string, value: boolean) {
//     if (key === 'baseRes') {
//       this.state.setCustomBaseRes(value);
//     } else {
//       this.state.setCustomOutputRes(value);
//     }
// >>>>>>> master
