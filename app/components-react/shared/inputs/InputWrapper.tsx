import { Form } from 'antd';
import React from 'react';
import { FormItemProps } from 'antd/lib/form/FormItem';
import omit from 'lodash/omit';

/**
 * Wraps Form.Item and adds data-attributes
 * Can display unwrapped content if nowWrap parameter is set to true
 */
export default function InputWrapper(p: FormItemProps & { nowrap?: boolean }) {
  const formItemProps = omit(p, 'nowrap');
  const label = p.label || ' ';
  return p.nowrap ? (
    <>{p.children}</>
  ) : (
    <Form.Item colon={false} {...formItemProps} label={label}>
      {formItemProps.children}
    </Form.Item>
  );
}
