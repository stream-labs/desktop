import React, { useContext } from 'react';
import { Form as AntForm } from 'antd';
import { FormInstance, FormProps, FormItemProps } from 'antd/lib/form';
import { useOnCreate } from '../../hooks';

type TFormContext = {
  antForm: FormInstance;
  nowrap?: boolean;
} & Pick<FormItemProps, 'labelCol' | 'wrapperCol'>;

export const FormContext = React.createContext<TFormContext | null>(null);

export default React.memo(function Form(p: FormProps) {
  console.log('render form', p);
  const context = useContext(FormContext);
  const [antForm] = AntForm.useForm(context?.antForm || p.form);
  const contextValue = useOnCreate(() => {
    const layouts = {
      horizontal: {
        labelCol: { span: 8 },
        wrapperCol: { span: 16 },
      },
      vertical: {
        labelCol: { span: 24 },
        wrapperCol: { span: 24 },
      },
    };
    const layout = layouts[p.layout || 'horizontal'];
    return {
      ...layout,
      antForm,
    };
  });

  const dataAttrs = {
    'data-role': 'form',
    'data-name': p.name,
  };

  return (
    <FormContext.Provider value={contextValue}>
      {context ? (
        <div {...dataAttrs}>{p.children}</div>
      ) : (
        <AntForm {...dataAttrs} {...contextValue.layout} {...p} form={antForm}>
          {p.children}
        </AntForm>
      )}
    </FormContext.Provider>
  );
});

export function useForm() {
  return AntForm.useForm()[0];
}
