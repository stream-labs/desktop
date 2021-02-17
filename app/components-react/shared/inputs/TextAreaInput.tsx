import React from 'react';
import { Input } from 'antd';
import { TSlobsInputProps, useTextInput, ValuesOf } from './inputs';
import InputWrapper from './InputWrapper';
import { TextAreaProps } from 'antd/lib/input';

const ANT_SELECT_FEATURES = ['disabled'] as const;

export function TextAreaInput(
  p: TSlobsInputProps<{}, string, TextAreaProps, ValuesOf<typeof ANT_SELECT_FEATURES>>,
) {
  const { inputAttrs, wrapperAttrs } = useTextInput(p);
  return (
    <InputWrapper {...wrapperAttrs}>
      <Input.TextArea {...inputAttrs} />
    </InputWrapper>
  );
}
