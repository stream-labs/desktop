import { InputProps } from 'antd/lib/input';
import { Ref, useEffect, RefObject, useRef, useContext, ChangeEvent } from 'react';
import { Input } from 'antd';
import { FormContext } from './ContextForm';
import { useOnCreate } from '../../hooks';
import uuid from 'uuid';
import { FormItemProps } from 'antd/lib/form';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import omit from 'lodash/omit';
/**
 * Shared code for inputs
 */

type TInputType = 'text' | 'textarea' | 'toggle' | 'checkbox' | 'list' | 'tags';

const customProps = ['onInputChange', 'uncontrolled', 'debounce'];
const customWrapperProps = ['nowrap'];
export interface IInputCustomProps<TValue> {
  value?: TValue;
  name?: string;
  nowrap?: boolean;
  onInput?: (val: TValue, ev?: ChangeEvent | CheckboxChangeEvent) => unknown;
  uncontrolled?: boolean;
  debounce?: number;
}

export type TCombinedProps<TInputProps, TValue> = Omit<
  FormItemProps & TInputProps,
  keyof IInputCustomProps<TValue>
> &
  IInputCustomProps<TValue>;
/**
 * Base hook for inputs
 * Registers input in the Form to properly handle validations
 * and returns props for Input and Wrapper components
 *
 * This hook does not handle 'onChange' events because it may be different for each Input component.
 * You should define onChange handler in component itself or use specific hooks like useTextInput() instead
 */
export function useInput<
  TValue,
  TLabel,
  TInputProps extends { name?: string; label?: TLabel; value?: TValue }
>(type: TInputType, inputProps: TInputProps & IInputCustomProps<TValue>) {
  const { name, value, label } = inputProps;
  const formContext = useContext(FormContext);
  const form = formContext?.form;

  const inputId = useOnCreate(() => {
    const id = `${name}-${uuid()}`;
    if (form) {
      form.setFieldsValue({ [id]: value });
    }
    return id;
  });

  // Create data-attributes for an Input element
  // These attributes help to find input in auto-tests
  const dataAttrs = {
    'data-type': type,
    'data-name': name,
    'data-title': label,
    'data-id': inputId,
  };

  const commonAttrs = {
    // omit custom props, because attributes must contain only html props and props from the antd lib
    ...omit(inputProps, ...customProps),
    // data attributes are valid html attributes
    ...dataAttrs,
    name: inputId,
  };

  const wrapperAttrs = {
    ...commonAttrs,
    'data-role': 'input-wrapper',
  };

  const inputAttrs = {
    ...omit(commonAttrs, ...customWrapperProps),
    'data-role': 'input',
  };

  return {
    inputAttrs,
    wrapperAttrs,
  };
}

/**
 * Hook for text fields: input, textarea, password
 * Use useInput() under the hood and handles onChange event
 */
export function useTextInput(inputProps: Parameters<typeof useInput>[1]) {
  const { inputAttrs, wrapperAttrs } = useInput('text', inputProps);

  // redirect `onChange` to the custom `onInputChange` handler
  // `onInputChange` accepts a value as a first argument
  // so it's more convenient to use in most situations
  const onChange = (ev: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    inputProps.onInput && inputProps.onInput(ev.target.value, ev);
  };
  return {
    wrapperAttrs,
    inputAttrs: {
      ...inputAttrs,
      onChange,
    },
  };
}

/**
 * 2-way binding util for inputs
 */
export function createVModel<TTarget extends object, TExtraProps extends object = {}>(
  target: TTarget,
  setter: (newTarget: TTarget) => unknown,
  extraPropsGenerator?: (fieldName: keyof TTarget) => TExtraProps,
) {
  return function<TFieldName extends keyof TTarget>(fieldName: TFieldName) {
    const extraProps = extraPropsGenerator ? extraPropsGenerator(fieldName) : {};
    return {
      name: fieldName,
      value: target[fieldName] as Required<TTarget>[TFieldName],
      onInput(newVal: unknown) {
        setter({ ...target, [fieldName]: newVal });
      },
      ...extraProps,
    };
  };
}
