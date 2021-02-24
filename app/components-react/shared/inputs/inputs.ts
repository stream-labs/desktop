import { InputProps } from 'antd/lib/input';
import React, {
  Ref,
  useEffect,
  RefObject,
  useRef,
  useContext,
  ChangeEvent,
  FocusEvent,
  useCallback,
} from 'react';
import { Input } from 'antd';
import { FormContext } from './Form';
import { useDebounce, useOnCreate, useStateHelper } from '../../hooks';
import uuid from 'uuid';
import { FormItemProps } from 'antd/lib/form';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import omit from 'lodash/omit';
import { $t } from '../../../services/i18n';
import { pick } from 'lodash';
/**
 * Shared code for inputs
 */

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

// export type TSlobsInputProps<TInputProps, TValue> = Omit<
//   FormItemProps & TInputProps,
//   keyof IInputCustomProps<TValue>
// > &
//   IInputCustomProps<TValue>;

export type ValuesOf<T extends ReadonlyArray<string>> = T[number];

/**
 * From T, pick a set of properties whose keys are in the union K
 */
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

export type TSlobsInputProps<
  TCustomProps extends object,
  TValue,
  TAntProps = {},
  TFeatures extends keyof Partial<TAntProps> = never
> = Pick<TAntProps, TFeatures> & FormItemProps & IInputCommonProps<TValue> & TCustomProps;

/**
 * Base hook for inputs
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

  // get parent form
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

  const { stateRef, updateState } = useStateHelper({ value: inputProps.value });
  const emitChangeDebounced = useDebounce(inputProps.debounce, emitChange);

  function emitChange() {
    console.log('emit change', stateRef.current);
    inputProps.onChange && inputProps.onChange(stateRef.current.value!);
  }

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

  // Create the "required" validation rule
  const rules = inputProps.rules ? [...inputProps.rules] : [];
  if (inputProps.required) {
    rules.push({ required: true, message: $t('The field is required') });
  }

  const wrapperAttrs = {
    // pick used features of Form.Item
    ...pick(inputProps, [
      'className',
      'style',
      'key',
      'label',
      'colon',
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
 * Use useInput() under the hood and handles the onChange event
 */
export function useTextInput<T = string>(
  p: Parameters<typeof useInput>[1] & TSlobsInputProps<InputProps, T> & { uncontrolled?: boolean },
  antFeatures?: Parameters<typeof useInput>[2],
) {
  const { inputAttrs, wrapperAttrs, stateRef } = useInput('text', p, antFeatures);

  // Text inputs are uncontrolled by default for better performance
  const uncontrolled = p.uncontrolled === true || p.uncontrolled !== false;

  const onChange = useCallback((ev: ChangeEvent<any>) => {
    if (!uncontrolled || p.debounce) {
      console.log('Component is controlled, call onChange', ev.target.value);
      inputAttrs.onChange(ev.target.value);
    }

    // for uncontrolled inputs the `onChange()` event handles in `onBlur()`
    // use the `onInput()` event if you need to handle every keypress in controlled input
  }, []);

  const onBlur = useCallback((ev: FocusEvent<any>) => {
    // for uncontrolled components call the onChange() handler on blur
    if (uncontrolled) {
      console.log('Component is UNcontrolled, call onBlur', ev.target.value);
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
    originalOnChange: inputAttrs.onChange,
  };
}

/**
 * 2-way binding util for inputs
 *
 * @example
 * <pre>
 * function MyComponent() {
 *  const [myState, setMyState] = useState({name: '', email: ''});
 *  const bind = createBinding(myState, setMyState);
 * return <form>
 *     <input label="User Name" {...bind('name')}>
 *     <input label="User Email" {...bind('email')}>
 *   </form>
 *  }
 * </pre>
 */
export function createBinding<TTarget extends object, TExtraProps extends object = {}>(
  target: TTarget,
  setter: (newTarget: TTarget) => unknown,
  extraPropsGenerator?: (fieldName: keyof TTarget) => TExtraProps,
) {
  return function<TFieldName extends keyof TTarget>(fieldName: TFieldName) {
    const extraProps = extraPropsGenerator ? extraPropsGenerator(fieldName) : {};
    return {
      name: fieldName,
      value: target[fieldName] as Required<TTarget>[TFieldName],
      onChange(newVal: unknown) {
        setter({ ...target, [fieldName]: newVal });
      },
      ...extraProps,
    };
  };
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
