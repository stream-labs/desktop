import { Input } from 'antd';
import React from 'react';
import { InputComponent, TSlobsInputProps, useTextInput } from './inputs';
import InputWrapper from './InputWrapper';
import { InputProps } from 'antd/lib/input';

export type TTextInputProps = TSlobsInputProps<
  {
    uncontrolled?: boolean;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    inputRef?: React.Ref<Input>;
  },
  string,
  InputProps
>;

export const TextInput = InputComponent((p: TTextInputProps) => {
  const { inputAttrs, wrapperAttrs } = useTextInput(p);
  return (
    <InputWrapper {...wrapperAttrs}>
      <Input {...inputAttrs} onFocus={p.onFocus} onKeyDown={p.onKeyDown} ref={p.inputRef} />
    </InputWrapper>
  );
});
