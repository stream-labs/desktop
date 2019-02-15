import * as inputs from './inputs';
import { Validator } from 'vee-validate';
import { $t } from 'services/i18n';
import { cloneDeep } from 'lodash';

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
  file = 'file',
  timer = 'timer',
  toggle = 'toggle',
  mediaGallery = 'mediaGallery',
  sound = 'sound',
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
  disabled?: boolean;
  uuid?: string;
  name?: string;
}

export interface INumberMetadata extends IInputMetadata {
  min?: number;
  max?: number;
  placeholder?: string;
  isInteger?: boolean;
}

export interface ITimerMetadata extends INumberMetadata {
  format?: 'hms' | 'hm' | 'ms';
}

export interface IListMetadata<TValueType> extends IInputMetadata {
  options: IListOption<TValueType>[];
  allowEmpty?: boolean;
  loading?: boolean;
  internalSearch?: boolean;
  allowCustom?: Function;
  noResult?: string;
}

export interface ITextMetadata extends IInputMetadata {
  placeholder?: string;
  max?: number;
  min?: number;
  dateFormat?: string;
  alphaNum?: boolean;
  masked?: boolean;
  fullWidth?: boolean;
}

export interface ISliderMetadata extends IInputMetadata {
  min?: number;
  max?: number;
  interval?: number;
  usePercentages?: boolean;
  hasValueBox?: boolean;
  data?: string[];
}

export interface IListOption<TValue> {
  value: TValue;
  title: string;
  description?: string;
  options?: { label: string; value: string }[];
}

export interface IMediaGalleryMetadata extends IInputMetadata {
  clearImage?: string;
  filter?: 'audio' | 'image';
}

export interface IFileMetadata extends IInputMetadata {
  filters?: Electron.FileFilter[];
  directory?: boolean;
}

// a helper for creating metadata for inputs
export const metadata = {
  timer: (options: ITimerMetadata) => ({ type: EInputType.timer, ...options } as ITimerMetadata),
  bool: (options: IInputMetadata) => ({ type: EInputType.bool, ...options } as IInputMetadata),
  number: (options: INumberMetadata) =>
    ({ type: EInputType.number, ...options } as INumberMetadata),
  text: (options: ITextMetadata) => ({ type: EInputType.text, ...options } as ITextMetadata),
  list: (options: IListMetadata<string>) =>
    ({ type: EInputType.list, ...options } as IListMetadata<string>),
  color: (options: IInputMetadata) => ({ type: EInputType.color, ...options } as IInputMetadata),
  slider: (options: ISliderMetadata) =>
    ({ type: EInputType.slider, ...options } as ISliderMetadata),
  textArea: (options: ITextMetadata) =>
    ({ type: EInputType.textArea, ...options } as ITextMetadata),
  fontSize: (options: INumberMetadata) =>
    ({ type: EInputType.fontSize, ...options } as INumberMetadata),
  fontFamily: (options: IInputMetadata) =>
    ({ type: EInputType.fontFamily, ...options } as IInputMetadata),
  code: (options: IInputMetadata) => ({ type: EInputType.code, ...options } as IInputMetadata),
  file: (options: IFileMetadata) => ({ type: EInputType.file, ...options } as IFileMetadata),
  toggle: (options: IInputMetadata) => ({ type: EInputType.toggle, ...options } as IInputMetadata),
  mediaGallery: (options: IMediaGalleryMetadata) =>
    ({ type: EInputType.mediaGallery, ...options } as IMediaGalleryMetadata),
  sound: (options: IMediaGalleryMetadata) =>
    ({ type: EInputType.sound, ...options } as IMediaGalleryMetadata),
};

// a helper for creating metadata for forms
export function formMetadata<TMetadataType extends Dictionary<IInputMetadata>>(
  inputsMetadata: TMetadataType,
): TMetadataType {
  // setup object key as a name property
  const formMetadata = cloneDeep(inputsMetadata);
  Object.keys(inputsMetadata).forEach(key => {
    if (formMetadata[key]['name']) return;
    formMetadata[key]['name'] = key;
  });

  return formMetadata;
}

// rules https://baianat.github.io/vee-validate/guide/rules.html
const validationMessages = {
  en: {
    messages: {
      required: () => $t('The field is required'),
      min_value: (fieldName: string, params: number[]) =>
        `The field value must be ${params[0]} or larger`,
      max_value: (fieldName: string, params: number[]) =>
        `The field value must be ${params[0]} or less`,
      date_format: (fieldName: string, params: number[]) =>
        `The date must be in ${params[0]} format`,
      alpha_num: () => $t('This field may only contain alphabetic characters or numbers'),
    },
  },
};

// Override and merge the dictionaries
Validator.localize(validationMessages);
