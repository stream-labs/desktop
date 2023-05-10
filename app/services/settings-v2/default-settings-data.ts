import { EVideoFormat, EColorSpace, ERangeType, EScaleType, EFPSType } from 'obs-studio-node';

export const verticalDisplayData = {
  fpsNum: 60,
  fpsDen: 2,
  baseWidth: 1080,
  baseHeight: 1920,
  outputWidth: 1080,
  outputHeight: 1920,
  outputFormat: EVideoFormat.I420,
  colorspace: EColorSpace.CS709,
  range: ERangeType.Full,
  scaleType: EScaleType.Lanczos,
  fpsType: EFPSType.Fractional,
};
