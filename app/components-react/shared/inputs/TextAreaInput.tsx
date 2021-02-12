import React from 'react';
import { Input } from 'antd';
import { TSlobsInputProps, useTextInput } from './inputs';
import InputWrapper from './InputWrapper';
import { TextAreaProps } from 'antd/lib/input';

type CombinedProps = TSlobsInputProps<TextAreaProps, string>;
type InputProps = Omit<CombinedProps, 'onPressEnter'>;

export function TextAreaInput(p: TSlobsInputProps<InputProps, string>) {
  const { inputAttrs, wrapperAttrs } = useTextInput(p);
  return (
    <InputWrapper {...wrapperAttrs}>
      <Input.TextArea {...inputAttrs} />
    </InputWrapper>
  );
}
