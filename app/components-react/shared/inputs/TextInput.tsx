import { Input, Form } from 'antd';
import React from 'react';
import { TInputProps, useInputAttrs } from './inputs';

export function TextInput(props: TInputProps<string>) {
  const { wrapperAttrs, inputAttrs } = useInputAttrs('text', props);
  return (
    <Form.Item {...wrapperAttrs}>
      <Input {...inputAttrs} />
    </Form.Item>
  );
}
