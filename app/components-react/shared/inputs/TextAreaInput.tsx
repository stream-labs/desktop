import { Input, Form } from 'antd';
import React from 'react';
import { TInputProps, useInput } from './inputs';

export function TextAreaInput(props: TInputProps<string>) {
  const { wrapperAttrs, inputAttrs } = useInput('textarea', props);
  return (
    <Form.Item {...wrapperAttrs}>
      <Input.TextArea {...inputAttrs} />
    </Form.Item>
  );
}
