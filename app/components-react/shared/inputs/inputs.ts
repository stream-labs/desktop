import { InputProps } from 'antd/lib/input';
/**
 * Shared code for inputs
 */

type TInputType = 'text';

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

export function useInputAttrs(type: TInputType, inputProps: IInputMetadata & InputProps) {
  const { name, title, value, placeholder } = inputProps;
  const wrapperAttrs = {
    name,
    label: title,
    rules: inputProps.required ? [{ required: true }] : [],
    'data-role': 'input',
    'data-type': type,
    'data-name': name,
    'data-title': title,
  };
  const inputAttrs = {
    value,
    name,
    placeholder,
  };
  return { wrapperAttrs, inputAttrs };
}
