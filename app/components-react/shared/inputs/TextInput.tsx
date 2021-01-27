import { Input, Form } from 'antd';
import React from 'react';
import { TInputProps, useInput } from './inputs';

export function TextInput(props: TInputProps<string>) {
  const { wrapperAttrs, inputAttrs } = useInput('text', props);
  return (
    <Form.Item {...wrapperAttrs}>
      <Input {...inputAttrs} />
    </Form.Item>
  );
}
