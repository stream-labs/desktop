import { Input } from 'antd';
import React from 'react';
import { TCombinedProps, useTextInput } from './inputs';
import InputWrapper from './InputWrapper';
import { InputProps } from 'antd/lib/input';

export function TextInput(p: TCombinedProps<InputProps, string>) {
  const { inputAttrs, wrapperAttrs } = useTextInput(p);
  return (
    <InputWrapper {...wrapperAttrs}>
      <Input {...inputAttrs} />
    </InputWrapper>
  );
}
