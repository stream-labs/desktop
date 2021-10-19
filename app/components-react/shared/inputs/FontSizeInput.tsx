import React from 'react';
import { TSlobsInputProps } from './inputs';
import { SliderInput } from './SliderInput';

export function FontSizeInput(p: TSlobsInputProps<{}, number>) {
  return <SliderInput {...p} min={8} max={144} />;
}
