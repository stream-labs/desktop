import React, { useEffect, useRef } from 'react';
import { Input } from 'antd';
import { InputComponent, TSlobsInputProps, useTextInput } from './inputs';
import InputWrapper from './InputWrapper';
import CodeMirror from 'codemirror';

export type TCodeInputProps = TSlobsInputProps<{ lang: 'js' | 'html' | 'css' | 'json' }, string>;

export const CodeInput = InputComponent((p: TCodeInputProps) => {
  const { inputAttrs, wrapperAttrs } = useTextInput('code', p);

  const textAreaRef = useRef<any>();

  useEffect(() => {
    const $textarea = textAreaRef.current.resizableTextArea.textArea;
    CodeMirror.fromTextArea($textarea);
    // console.log('Textarea', $textarea);
  }, []);

  return (
    <InputWrapper {...wrapperAttrs}>
      <Input.TextArea {...inputAttrs} ref={textAreaRef} />
    </InputWrapper>
  );
});
