import * as obs from 'obs-studio-node';

export type TDefaultVideoSetting = 'default' | 'defaultVertical';

export const horizontalDisplayData = {
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

export const verticalDisplayData = {
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
