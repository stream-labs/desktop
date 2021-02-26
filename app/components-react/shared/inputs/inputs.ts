/**
 * Shared code for inputs
 */
import { InputProps } from 'antd/lib/input';
import React, { useEffect, useContext, ChangeEvent, FocusEvent, useCallback } from 'react';
import { FormContext } from './Form';
import { useDebounce, useOnCreate, useFormState } from '../../hooks';
import uuid from 'uuid';
import { FormItemProps } from 'antd/lib/form';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { $t } from '../../../services/i18n';
import { pick } from 'lodash';

type TInputType =
  | 'text'
  | 'textarea'
  | 'toggle'
  | 'checkbox'
  | 'list'
  | 'tags'
  | 'switch'
  | 'slider';

export interface IInputCommonProps<TValue> {
  value?: TValue;
  defaultValue?: TValue;
  name?: string;
  nowrap?: boolean;
  onChange?: (val: TValue, ev?: ChangeEvent | CheckboxChangeEvent) => unknown;
  onInput?: (val: TValue, ev?: ChangeEvent | CheckboxChangeEvent) => unknown;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  debounce?: number;
}

export type ValuesOf<T extends ReadonlyArray<string>> = T[number];

/**
 * A helper type for input props
 */
export type TSlobsInputProps<
  TCustomProps extends object, // custom input props defined for SLOBS
  TValue, // the input value type
  TAntProps = {}, // props of the antd input that is working under the hood
  TFeatures extends keyof Partial<TAntProps> = never // props of antd input that we support
> = Pick<TAntProps, TFeatures> & FormItemProps & IInputCommonProps<TValue> & TCustomProps;

/**
 * A base hook for inputs
 * Registers input in the Form to properly handle validations
 * and returns props for Input and Wrapper components
 */
export function useInput<
  TValue,
  TLabel,
  TInputProps extends {
    name?: string;
    label?: TLabel;
    value?: TValue;
    rules?: FormItemProps['rules'];
  }
>(
  type: TInputType,
  inputProps: TInputProps & IInputCommonProps<TValue>,
  antFeatures?: readonly string[],
) {
  const { name, value, label } = inputProps;

  // get parent form if exist
  const formContext = useContext(FormContext);
  const form = formContext?.antForm;

  const inputId = useOnCreate(() => {
    // generate an unique id
    const id = `${name}-${uuid()}`;
    return id;
  });

  useEffect(() => {
    // if the input is inside the form
    // then we need to setup it's value via Form API
    if (form) form.setFieldsValue({ [inputId]: value });
  }, [value]);

  // create a local state for the input
  const { stateRef, updateState } = useFormState({ value: inputProps.value });

  // create an `emitChange()` method and it's debounced version
  function emitChange() {
    inputProps.onChange && inputProps.onChange(stateRef.current.value!);
  }
  const emitChangeDebounced = useDebounce(inputProps.debounce, emitChange);

  // create onChange handler
  const onChange = useCallback((newVal: TValue) => {
    if (newVal === stateRef.current.value) return;
    updateState({ value: newVal });
    inputProps.onInput && inputProps.onInput(newVal);
    if (!inputProps.onChange) return;
    if (inputProps.debounce) {
      emitChangeDebounced();
    } else {
      emitChange();
    }
  }, []);

  // Create data-attributes for an Input element
  // These attributes help to find inputs in auto-tests
  const dataAttrs = {
    'data-type': type,
    'data-name': name,
    'data-title': label,
    'data-id': inputId,
  };

  // Handle a shortcut for the "required" validation rule
  const rules = inputProps.rules ? [...inputProps.rules] : [];
  if (inputProps.required) {
    rules.push({ required: true, message: $t('The field is required') });
  }

  // pick props for the input wrapper
  const wrapperAttrs = {
    ...pick(inputProps, [
      'className',
      'style',
      'key',
      'label',
      'extra',
      'labelCol',
      'wrapperCol',
      'disabled',
      'nowrap',
    ]),
    rules,
    'data-role': 'input-wrapper',
    name: inputId,
  };

  // pick props for the input element
  const inputAttrs = {
    ...(pick(inputProps, 'disabled', 'placeholder', antFeatures || []) as {}),
    ...dataAttrs,
    'data-role': 'input',
    name: inputId,
    value: stateRef.current.value,
    onChange,
  };

  return {
    inputAttrs,
    wrapperAttrs,
    stateRef,
  };
}

/**
 * Hook for text fields: input, textarea, password, number
 */
export function useTextInput<T = string>(
  p: Parameters<typeof useInput>[1] & TSlobsInputProps<InputProps, T> & { uncontrolled?: boolean },
  antFeatures?: Parameters<typeof useInput>[2],
) {
  const { inputAttrs, wrapperAttrs, stateRef } = useInput('text', p, antFeatures);

  // Text inputs are uncontrolled by default for better performance
  const uncontrolled = p.uncontrolled === true || p.uncontrolled !== false;

  // we need to handle onChange differently for text inputs
  const onChange = useCallback((ev: ChangeEvent<any>) => {
    // for controlled and debounced inputs call the `onChange()` handler immediately
    if (!uncontrolled || p.debounce) {
      inputAttrs.onChange(ev.target.value);
    }

    // for uncontrolled inputs the `onChange()` event handles in `onBlur()`
    // use the `onInput()` event if you need to handle every keypress in controlled input
  }, []);

  const onBlur = useCallback((ev: FocusEvent<any>) => {
    // for uncontrolled components call the `onChange()` handler on blur
    if (uncontrolled) {
      inputAttrs.onChange(ev.target.value);
    }
    p.onBlur && p.onBlur(ev);
  }, []);

  return {
    wrapperAttrs,
    inputAttrs: {
      ...inputAttrs,
      onChange,
      onBlur,
    },
    stateRef,
    originalOnChange: inputAttrs.onChange,
  };
}

export type TBindings<TState, TExtraProps = {}> = Record<
  keyof TState,
  {
    name: keyof TState;
    value: TState[keyof TState];
    onChange: (newVal: TState[keyof TState]) => unknown;
  } & TExtraProps
>;

/**
 * 2-way binding util for inputs
 *
 * @example
 * <pre>
 * function MyComponent() {
 *  const [myState, setMyState] = useState({name: '', email: ''});
 *  const bind = createBinding(myState, setMyState);
 * return <form>
 *     <input label="User Name" {...bind.name}>
 *     <input label="User Email" {...bind.email}>
 *   </form>
 *  }
 * </pre>
 */
export function createBinding<TState extends object, TExtraProps extends object = {}>(
  target: TState,
  setter: (newTarget: TState) => unknown,
  extraPropsGenerator?: (fieldName: keyof TState) => TExtraProps,
): TBindings<TState, TExtraProps> {
  return new Proxy(
    {},
    {
      get(t, fieldName: keyof TState) {
        const extraProps = extraPropsGenerator ? extraPropsGenerator(fieldName) : {};
        return {
          name: fieldName,
          value: target[fieldName],
          onChange(newVal: unknown) {
            setter({ ...target, [fieldName]: newVal });
          },
          ...extraProps,
        };
      },
    },
  ) as TBindings<TState, TExtraProps>;
}

/**
 * Function for creating new input components
 * For performance optimization ignores changing of all function props like onChange and onInput
 */
export function InputComponent<T extends Function>(f: T): T {
  return (React.memo(f as any, (prevProps: any, newProps: any) => {
    const keys = Object.keys(newProps);
    if (keys.length !== Object.keys(prevProps).length) return false;
    for (const key of keys) {
      if (typeof newProps[key] === 'function') continue;
      if (newProps[key] !== prevProps[key]) return false;
    }
    return true;
  }) as any) as T;
}
