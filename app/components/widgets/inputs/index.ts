import * as widgetInputComponents from './inputs';
import {
  inputComponents as sharedInputComponents,
  metadata as sharedMetadata,
  EInputType, IInputMetadata
} from 'components/shared/inputs';


export * from  './inputs';

export const inputComponents = {
  ...sharedInputComponents,
  ...widgetInputComponents
};

export enum EWInput {
  animation = 'animation'
}

export interface IAnimationMetadata extends IInputMetadata {
  filter?: 'in' | 'out'
}

export const metadata = {
  ...sharedMetadata,
  animation: (options: IAnimationMetadata) => ({ type: EWInput.animation, ...options } as IAnimationMetadata)
};

