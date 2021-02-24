import React from 'react';
import { Input } from 'antd';
import { InputComponent, TSlobsInputProps, useTextInput, ValuesOf } from './inputs';
import InputWrapper from './InputWrapper';
import { TextAreaProps } from 'antd/lib/input';

const ANT_TEXTAREA_FEATURES = ['showCount', 'autoSize', 'maxLength'] as const;

export type TTextAreaInputProps = TSlobsInputProps<
  {},
  string,
  TextAreaProps,
  ValuesOf<typeof ANT_TEXTAREA_FEATURES>
>;

export const TextAreaInput = InputComponent((p: TTextAreaInputProps) => {
  const { inputAttrs, wrapperAttrs } = useTextInput(p, ANT_TEXTAREA_FEATURES);
  return (
    <InputWrapper {...wrapperAttrs}>
      <Input.TextArea {...inputAttrs} />
    </InputWrapper>
  );
});
