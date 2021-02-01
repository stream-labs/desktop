import { Form } from 'antd';
import React from 'react';
import { FormItemProps } from 'antd/lib/form/FormItem';

/**
 * Wraps Form.Item and adds data-attributes
 * Can display unwrapped content if nowWrap parameter is set to true
 */
export default function InputWrapper(p: FormItemProps & { nowrap?: boolean }) {
  return p.nowrap ? <>{p.children}</> : <Form.Item {...p}>{p.children}</Form.Item>;
}
