import { Input } from 'antd';
import React from 'react';
import { InputComponent, TSlobsInputProps, useTextInput } from './inputs';
import InputWrapper from './InputWrapper';
import { InputProps } from 'antd/lib/input';

export const TextInput = InputComponent(
  (p: TSlobsInputProps<{ uncontrolled?: boolean }, string, InputProps>) => {
    const { inputAttrs, wrapperAttrs } = useTextInput(p);
    return (
      <InputWrapper {...wrapperAttrs}>
        <Input {...inputAttrs} />
      </InputWrapper>
    );
  },
);
