import React from 'react';
import { Input } from 'antd';
import { InputComponent, TSlobsInputProps, useTextInput, ValuesOf } from './inputs';
import InputWrapper from './InputWrapper';
import { TextAreaProps } from 'antd/lib/input';

const ANT_TEXTAREA_FEATURES = ['showCount', 'autoSize', 'maxLength', 'rows'] as const;

export type TTextAreaInputProps = TSlobsInputProps<
  {
    onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  },
  string,
  TextAreaProps,
  ValuesOf<typeof ANT_TEXTAREA_FEATURES>
>;

export const TextAreaInput = InputComponent((p: TTextAreaInputProps) => {
  const { inputAttrs, wrapperAttrs } = useTextInput('textarea', p, ANT_TEXTAREA_FEATURES);

  const textInputAttrs = {
    ...inputAttrs,
    onKeyDown: p.onKeyDown,
  };

  return (
    <InputWrapper {...wrapperAttrs}>
      <Input.TextArea {...textInputAttrs} />
    </InputWrapper>
  );
});
