import React, { useEffect, useRef } from 'react';
import { Input } from 'antd';
import { InputComponent, TSlobsInputProps, useInput, useTextInput } from './inputs';
import InputWrapper from './InputWrapper';
import CodeMirror, { EditorFromTextArea } from 'codemirror';
import { Services } from '../../service-provider';
import { getDefined } from '../../../util/properties-type-guards';

export type TCodeInputProps = TSlobsInputProps<
  { lang: 'js' | 'html' | 'css' | 'json'; height?: number | string },
  string
>;

export const CodeInput = InputComponent((p: TCodeInputProps) => {
  const { inputAttrs, wrapperAttrs } = useInput('code', p);

  const textAreaRef = useRef<any>();
  const codemirrorRef = useRef<EditorFromTextArea>();
  const value = inputAttrs.value || '';

  // convert Textarea into a Codemirror editor on mount
  useEffect(() => {
    const $textarea = textAreaRef.current.resizableTextArea.textArea as HTMLTextAreaElement;
    const options = {
      ...codemirrorOptions.common,
      mode: codemirrorOptions[p.lang].mode,
      theme: Services.CustomizationService.isDarkTheme ? 'material' : 'xq-light',
    };
    const codemirror = (codemirrorRef.current = CodeMirror.fromTextArea($textarea, options));
    codemirror.setSize('100%', p.height || 100);
    codemirror.on('changes', (cm, changeObj) => {
      inputAttrs.onChange(cm.getValue());
    });
    return () => codemirror.getWrapperElement().remove();
  }, [p.lang, p.height]);

  // sync codemirror value with props
  useEffect(() => {
    const cm = getDefined(codemirrorRef.current);
    const cmVal = cm.getValue();
    if (cmVal !== value) cm.setValue(value);
  }, [value]);

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
