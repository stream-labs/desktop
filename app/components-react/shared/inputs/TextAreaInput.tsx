import { Input, Form } from 'antd';
import React from 'react';
import { TInputProps, useInputAttrs } from './inputs';

export function TextAreaInput(props: TInputProps<string>) {
  const { wrapperAttrs, inputAttrs } = useInputAttrs('textarea', props);
  return (
    <Form.Item {...wrapperAttrs}>
      <Input.TextArea {...inputAttrs} />
    </Form.Item>
  );
}
