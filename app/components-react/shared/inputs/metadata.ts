import { Rule } from 'antd/lib/form';
import { TInputType } from './inputs';

/**
 * Metadata generator for inputs
 * Provides some presets and helps with typechecking
 */
export const metadata = {
  any: (options: IAnyMetadata) => options,
  text: (options: ITextMetadata) => ({ ...options, type: 'text' as TInputType }),
  number: (options: INumberMetadata) => ({ ...options, type: 'number' as TInputType }),
  slider: (options: ISliderMetadata) => ({ ...options, type: 'slider' as TInputType }),
  bool: (options: ITextBoolMetadata) => ({ ...options, type: 'bool' as TInputType }),
  list: <T>(options: IListMetadata<T>) => ({ ...options, type: 'list' as TInputType }),
  autocomplete: <T>(options: IListMetadata<T>) => ({
    ...options,
    type: 'autocomplete' as TInputType,
  }),
  seconds: (options: ISliderMetadata) => ({
    min: 0,
    step: 1000,
    tipFormatter: (ms: number) => `${ms / 1000}s`,
    ...options,
    type: 'seconds',
  }),
};

export type TInputMetadata<T = string> =
  | ITextMetadata
  | INumberMetadata
  | ISliderMetadata
  | ITextBoolMetadata
  | IListMetadata<T>;

interface IBaseMetadata {
  label?: string;
  tooltip?: string;
  required?: boolean;
  type?: TInputType;
  rules?: Rule[];
  onChange?: (value: unknown) => void;
  children?: Dictionary<TInputMetadata<unknown>>;
  displayed?: boolean;
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

interface IAnyMetadata extends IBaseMetadata {
  value?: any;
}

export interface IListMetadata<T = string> extends IBaseMetadata {
  value?: T;
  options?: { label: string; value: T }[];
}
