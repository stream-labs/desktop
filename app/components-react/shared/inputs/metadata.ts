interface IBaseMetadata {
  label?: string;
  tooltip?: string;
  required?: boolean;
}

interface ITextMetadata extends IBaseMetadata {
  value?: string;
}

interface INumberMetadata extends IBaseMetadata {
  value?: number;
  min?: number;
  max?: number;
}

interface ISliderMetadata extends IBaseMetadata {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  tipFormatter?: (val: number) => string;
}

interface ITextBoolMetadata extends IBaseMetadata {
  value?: boolean;
}

export const metadata = {
  text: (options: ITextMetadata) => options,
  number: (options: INumberMetadata) => options,
  slider: (options: ISliderMetadata) => options,
  bool: (options: ITextBoolMetadata) => options,
  seconds: (options: ISliderMetadata) => ({
    min: 0,
    step: 1000,
    tipFormatter: (ms: number) => `${ms / 1000}s`,
    ...options,
  }),
};
