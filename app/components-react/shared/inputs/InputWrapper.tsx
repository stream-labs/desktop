import { Form } from 'antd';
import React, { useContext } from 'react';
import { FormItemProps } from 'antd/lib/form/FormItem';
import { omit, pick } from 'lodash';
import { FormContext } from './Form';
import { InputComponent } from './inputs';

/**
 * Wraps Form.Item
 * Can display unwrapped content if nowrap parameter is set to true
 */
export default InputComponent(function InputWrapper(p: FormItemProps & { nowrap?: boolean }) {
  const formItemProps = omit(p, 'nowrap');
  const label = p.label || ' ';

  // take layout from the form context
  const context = useContext(FormContext);
  const layout = context ? pick(context, 'labelCol', 'wrapperCol') : {};

  return p.nowrap ? (
    <>{p.children}</>
  ) : (
    <Form.Item colon={false} {...layout} {...formItemProps} label={label}>
      {formItemProps.children}
    </Form.Item>
  );
});
