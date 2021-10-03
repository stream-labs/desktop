import React, { useEffect, useRef } from 'react';
import { Input } from 'antd';
import {InputComponent, TSlobsInputProps, useInput, useTextInput} from './inputs';
import InputWrapper from './InputWrapper';
import CodeMirror from 'codemirror';
import { Services } from '../../service-provider';

export type TCodeInputProps = TSlobsInputProps<
  { lang: 'js' | 'html' | 'css' | 'json'; height?: number | string },
  string
>;

export const CodeInput = InputComponent((p: TCodeInputProps) => {
  const { inputAttrs, wrapperAttrs } = useInput('code', p);

  const textAreaRef = useRef<any>();

  // convert Textarea into a Codemirror editor on mount
  useEffect(() => {
    const $textarea = textAreaRef.current.resizableTextArea.textArea as HTMLTextAreaElement;
    const options = {
      ...codemirrorOptions.common,
      mode: codemirrorOptions[p.lang].mode,
      theme: Services.CustomizationService.isDarkTheme ? 'material' : 'xq-light',
    };
    const codemirror = CodeMirror.fromTextArea($textarea, options);
    codemirror.setSize('100%', p.height || 100);
    codemirror.setValue(inputAttrs.value || '');
    codemirror.on('changes', (cm, changeObj) => {
      inputAttrs.onChange(cm.getValue());
    });
  }, [p.lang, p.height]);

  return (
    <InputWrapper {...wrapperAttrs}>
      <Input.TextArea ref={textAreaRef} />
    </InputWrapper>
  );
});

const codemirrorOptions = {
  common: {
    keyMap: 'sublime',
    lineNumbers: true,
    autofocus: true,
    tabSize: 2,
    autoRefresh: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    autoCloseTags: true,
    extraKeys: {
      Tab: 'emmetExpandAbbreviation',
      Enter: 'emmetInsertLineBreak',
    },
  },
  html: {
    mode: 'htmlmixed',
  },
  css: {
    mode: 'text/css',
  },
  js: {
    mode: 'javascript',
  },
  json: {
    mode: 'javascript',
  },
};
