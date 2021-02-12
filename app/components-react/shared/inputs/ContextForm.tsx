import React, { useState, HTMLAttributes, useRef } from 'react';
import { Form } from 'antd';
import { FormInstance, FormProps } from 'antd/lib/form';

interface IFormContext {
  form: FormInstance;
}
export const FormContext = React.createContext<IFormContext | null>(null);

// TODO: join ContextFrom and Form into a single component
export default function ContextForm(p: FormProps) {
  const form = p.form || Form.useForm()[0];
  const layouts = {
    horizontal: {
      labelCol: { span: 8 },
      wrapperCol: { span: 16 },
    },
  };
  const layout = layouts[p.layout || 'horizontal'];
  return (
    <FormContext.Provider value={{ form }}>
      <Form {...layout} {...p} form={form}>
        {p.children}
      </Form>
    </FormContext.Provider>
  );
}
