import { Switch } from 'antd';
import React from 'react';
import { InputComponent, TSlobsInputProps, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { SwitchProps } from 'antd/lib/switch';

export type TSwitchInputProps = TSlobsInputProps<{}, boolean, SwitchProps>;

export const SwitchInput = InputComponent((p: TSwitchInputProps) => {
  const { wrapperAttrs, inputAttrs, stateRef } = useInput('switch', p);
  return (
    <InputWrapper {...wrapperAttrs}>
      <Switch checked={stateRef.current.value} size="small" {...inputAttrs} />
    </InputWrapper>
  );
});
