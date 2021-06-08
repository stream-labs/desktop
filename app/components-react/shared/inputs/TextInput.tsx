import { Input } from 'antd';
import React from 'react';
import { InputComponent, TSlobsInputProps, useTextInput } from './inputs';
import InputWrapper from './InputWrapper';
import { InputProps } from 'antd/lib/input';

export type TTextInputProps = TSlobsInputProps<{ uncontrolled?: boolean }, string, InputProps>;

export const TextInput = InputComponent((p: TTextInputProps) => {
  const { inputAttrs, wrapperAttrs } = useTextInput(p);
  return (
    <InputWrapper {...wrapperAttrs}>
      <Input {...inputAttrs} />
    </InputWrapper>
  );
});
