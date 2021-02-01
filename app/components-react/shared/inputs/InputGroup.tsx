import { Form } from 'antd';
import React, { HTMLAttributes } from 'react';

type TProps = { title?: string } & HTMLAttributes<unknown>;

export function InputGroup(p: TProps) {
  const title = p.title || ' ';

  // const layout = {
  //   wrapperCol: { offset: 8, span: 16 },
  // };

  return (
    <Form.Item label={title} colon={false}>
      {p.children}
    </Form.Item>
  );
}
