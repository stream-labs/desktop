import React, { useState, HTMLAttributes, useRef } from 'react';
import { Form } from 'antd';
import { IInputMetadata } from './inputs';
import { FormInstance, FormProps } from 'antd/lib/form';
//
// export default function SlobsForm(p: HTMLAttributes<unknown>) {
//   const [antdForm] = Form.useForm();
//   return <Form form={antdForm}>{p.children}</Form>;
// }

//
// let uuid = 0;
//
// interface IRegistredInput {
//   id: string;
//   elRef: unknown;
//   props: IInputMetadata;
// }
//
// export function useFormInput(props: IInputMetadata) {
//   const id = useState((uuid++).toString());
//   const elRef = useRef();
//   const { registerInput } = useSlobsForm();
//   registerInput({id, elRef});
// }
//
// const fields = {};
//
// export function useSlobsForm(p?: {
//   onFieldRegister: () => unknown
// }) {
//   // const [state, setState] = useState({ fields: {} });
//
//   function registerInput(input: IRegistredInput) {
//     fields[input.id] = input;
//   }
//
//   function unregisterInput(input: IRegistredInput) {
//     delete fields[input.id];
//   }
//
//   return { register }
// }

interface IFormContext {
  form: FormInstance;
}
export const FormContext = React.createContext<IFormContext | null>(null);

export default function ContextForm(p: FormProps) {
  const form = p.form || Form.useForm()[0];
  return (
    <FormContext.Provider value={{ form }}>
      <Form form={form}>{p.children}</Form>
    </FormContext.Provider>
  );
}
