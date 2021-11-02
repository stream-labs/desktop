import React from 'react';
import { TSlobsInputProps } from './inputs';
import { SliderInput } from './SliderInput';

export function FontWeightInput(p: TSlobsInputProps<{}, number>) {
  return <SliderInput {...p} min={300} max={900} step={100} />;
}
