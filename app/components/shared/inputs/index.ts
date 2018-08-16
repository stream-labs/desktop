import * as inputs from './inputs';
import { Validator } from 'vee-validate';
import { $t } from 'services/i18n';

export const inputComponents = inputs;

export enum EInputType {
  bool = 'bool',
  number = 'number',
  text = 'text',
  slider = 'slider',
  color = 'color',
  list = 'list',
  textArea = 'textArea',
  fontSize = 'fontSize',
  fontFamily = 'fontFamily',
  code = 'code',
}

/**
 * base interface for all metadata types
 */
export interface IInputMetadata {
  required?: boolean;
  description?: string;
  type?: EInputType;
  title?: string;
  tooltip?: string;
}

export interface INumberMetadata extends IInputMetadata {
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface IListMetadata<TValueType> extends IInputMetadata {
  options: IListOption<TValueType>[];
}

export interface ITextMetadata extends IInputMetadata {
  placeholder?: string;
  max?: number;
  dateFormat?: string;
  alpha?: boolean;
}

export interface ISliderMetadata extends IInputMetadata {
  min: number;
  max: number;
  interval?: number;
  usePercentages?: boolean;
  hasValueBox?: boolean;
}

export interface IListOption<TValue> {
  value: TValue;
  title: string;
  description?: string;
}

export interface IMediaGalleryMetadata extends IInputMetadata {
  fileName: string;
  clearImage: string;
}


// a helper for creating metadata
export const metadata = {
  bool: (options: IInputMetadata) => ({ type: EInputType.bool, ...options } as IInputMetadata),
  number: (options: INumberMetadata) => ({ type: EInputType.number, ...options } as INumberMetadata),
  text: (options: ITextMetadata) => ({ type: EInputType.text, ...options } as ITextMetadata),
  list: (options: IListMetadata<string>) => ({ type: EInputType.list, ...options } as IListMetadata<string>),
  color: (options: IInputMetadata) => ({ type: EInputType.color, ...options } as IInputMetadata),
  slider: (options: ISliderMetadata) => ({ type: EInputType.slider, ...options } as ISliderMetadata),
  textArea: (options: IInputMetadata) => ({ type: EInputType.textArea, ...options } as ITextMetadata),
  fontSize: (options: IInputMetadata) => ({ type: EInputType.fontSize, ...options } as IInputMetadata),
  fontFamily: (options: IInputMetadata) => ({ type: EInputType.fontFamily, ...options } as IInputMetadata),
  code: (options: IInputMetadata) => ({ type: EInputType.code, ...options } as IInputMetadata),
};

// rules https://baianat.github.io/vee-validate/guide/rules.html
const validationMessages = {
  en: {
    messages: {
      required: () => $t('The field is required'),
      min_value: (fieldName: string, params: number[]) => `The field value must be ${ params[0] } or larger`,
      max_value: (fieldName: string, params: number[]) => `The field value must be ${ params[0] } or less`,
      date_format: (fieldName: string, params: number[]) => `The date must be in ${ params[0] } format`,
      alpha: () => $t('This field may only contain alphabetic characters')
    }
  }
};

// Override and merge the dictionaries
Validator.localize(validationMessages);
