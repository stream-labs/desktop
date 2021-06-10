import { Switch } from 'antd';
import React from 'react';
import { InputComponent, TSlobsInputProps, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { SwitchProps } from 'antd/lib/switch';

export type TSwitchInputProps = TSlobsInputProps<
  { inputRef?: React.Ref<HTMLInputElement> },
  boolean,
  SwitchProps
>;

export const SwitchInput = InputComponent((p: TSwitchInputProps) => {
  const { wrapperAttrs, inputAttrs } = useInput('switch', p);
  return (
    <InputWrapper {...wrapperAttrs}>
      <Switch checked={inputAttrs.value} size="small" {...inputAttrs} ref={p.inputRef} />
    </InputWrapper>
  );
});
