import { InputProps } from 'antd/lib/input';
import { Ref, useEffect, RefObject, useRef, useContext } from 'react';
import { Input } from 'antd';
import { FormContext } from './SlobsForm';
import { useOnce } from '../../hooks';
import uuid from 'uuid';
/**
 * Shared code for inputs
 */

type TInputType = 'text' | 'textarea';

export interface IInputMetadata {
  name: string;
  title?: string;
  placeholder?: string;
  required?: boolean;
}

export interface IInputEvents<TValue = unknown> {
  onInput?: (val: TValue) => unknown;
}

export type TInputProps<TValue> = Omit<InputProps, keyof IInputEvents> &
  IInputEvents<TValue> &
  IInputMetadata;

/**
 * Create data-attributes for an Input element
 * These attributes help to find input in auto-tests
 */
export function useDataAttrs(type: TInputType, name: string) {
  return {
    'data-role': 'input',
    'data-type': type,
    'data-name': name,
  };
}

export function useInput(type: TInputType, inputProps: IInputMetadata & InputProps) {
  const { name, title, value, placeholder } = inputProps;
  const formContext = useContext(FormContext);
  const form = formContext?.form;

  const uniqueName = useOnce(() => {
    const uniqueName = `${name}-${uuid()}`;
    if (form) {
      form.setFieldsValue({ [uniqueName]: value });
    }
    return uniqueName;
  });

  const wrapperAttrs = {
    name: uniqueName,
    label: title,
    rules: inputProps.required ? [{ required: true }] : [],
    'data-role': 'input',
    'data-type': type,
    'data-name': name,
    'data-title': title,
  };
  const inputAttrs = {
    value: undefined,
    name: uniqueName,
    placeholder,
    // ref: inputRef as any,
  };

  // useEffect(() => {
  //   form.set;
  // }, [value]);

  // useEffect(() => {
  //   if (!inputRef.current) return;
  //
  //   if (['text', 'textarea', 'number'].includes(type)) {
  //     inputRef.current.input.value = value as string;
  //   }
  // }, [value]);

  return { wrapperAttrs, inputAttrs };
}
