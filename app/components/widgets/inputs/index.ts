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

export const metadata = {
  ...sharedMetadata,
  animation: (options: IInputMetadata) => ({ type: EInputType.animation, ...options } as IInputMetadata)
};

