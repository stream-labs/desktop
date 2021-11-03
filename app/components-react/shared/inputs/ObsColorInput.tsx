import React from 'react';
import { TSlobsInputProps } from './inputs';
import { ColorInput, hexStrToInt, intToHexStr, TColorInputProps } from './ColorInput';

export function ObsColorInput(p: TSlobsInputProps<{}, number>) {
  return (
    <ColorInput
      {...(p as TColorInputProps)}
      value={intToHexStr(p.value || 0)}
      hasAlpha={true}
      debounce={500}
      onChange={strVal => p.onChange && p.onChange(hexStrToInt(strVal))}
    />
  );
}
