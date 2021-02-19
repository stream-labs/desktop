import React from 'react';
import { Input } from 'antd';
import { TSlobsInputProps, useTextInput, ValuesOf } from './inputs';
import InputWrapper from './InputWrapper';
import { TextAreaProps } from 'antd/lib/input';

const ANT_TEXTAREA_FEATURES = ['disabled', 'showCount', 'autoSize', 'maxLength'] as const;

export function TextAreaInput(
  p: TSlobsInputProps<{}, string, TextAreaProps, ValuesOf<typeof ANT_TEXTAREA_FEATURES>>,
) {
  const { inputAttrs, wrapperAttrs } = useTextInput(p, ANT_TEXTAREA_FEATURES);
  return (
    <InputWrapper {...wrapperAttrs}>
      <Input.TextArea {...inputAttrs} />
    </InputWrapper>
  );
}
