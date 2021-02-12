import { Switch } from 'antd';
import React from 'react';
import { TSlobsInputProps, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { SwitchProps } from 'antd/lib/switch';

export function SwitchInput(p: TSlobsInputProps<SwitchProps, boolean>) {
  const { wrapperAttrs } = useInput('switch', p);
  return (
    <InputWrapper {...wrapperAttrs}>
      <Switch checked={p.value} size="small" />
    </InputWrapper>
  );
}
