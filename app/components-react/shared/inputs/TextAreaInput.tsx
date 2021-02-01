import { Input } from 'antd';
import React from 'react';
import { IInputCustomProps, TCombinedProps, useTextInput } from './inputs';
import InputWrapper from './InputWrapper';
import { TextAreaProps } from 'antd/lib/input';
import { FormItemProps } from 'antd/lib/form/FormItem';

type CombinedProps = TCombinedProps<TextAreaProps, string>;
type InputProps = Omit<CombinedProps, 'onPressEnter'>;

export function TextAreaInput(p: TCombinedProps<InputProps, string>) {
  const { inputAttrs, wrapperAttrs } = useTextInput(p);

  // TODO: replace to textarea
  return (
    <InputWrapper {...wrapperAttrs}>
      <Input.TextArea {...inputAttrs} />
    </InputWrapper>
  );
}
