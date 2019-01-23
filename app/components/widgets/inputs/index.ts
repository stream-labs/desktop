import * as widgetInputComponents from './inputs';
import {
  inputComponents as sharedInputComponents,
  metadata as sharedMetadata,
  IInputMetadata,
  IListMetadata,
  ISliderMetadata,
} from 'components/shared/inputs';

export * from './inputs';

export const inputComponents = {
  ...sharedInputComponents,
  ...widgetInputComponents,
};

export enum EWInput {
  animation = 'animation',
  frequency = 'frequency',
  sectionedMultiselect = 'sectionedMultiselect',
  numberList = 'numberList',
  spamSecurity = 'spamSecurity',
}

export interface ISpamSecurityMetadata extends ISliderMetadata {
  indexModifier?: number;
}

export interface IAnimationMetadata extends IInputMetadata {
  filter?: 'in' | 'out' | 'text';
}

export const metadata = {
  ...sharedMetadata,
  animation: (options: IAnimationMetadata) =>
    ({ type: EWInput.animation, ...options } as IAnimationMetadata),
  frequency: (options: IInputMetadata) =>
    ({ type: EWInput.frequency, ...options } as IInputMetadata),
  sectionedMultiselect: (
    options: IListMetadata<{ label: string; options: { value: string; label: string }[] }>,
  ) =>
    ({
      type: EWInput.sectionedMultiselect,
      ...options,
    } as IListMetadata<{ label: string; options: { value: string; label: string }[] }>),
  numberList: (options: IListMetadata<number>) =>
    ({ type: EWInput.numberList, ...options } as IListMetadata<number>),
  spamSecurity: (options: ISpamSecurityMetadata) =>
    ({ type: EWInput.spamSecurity, ...options } as ISpamSecurityMetadata),
};
