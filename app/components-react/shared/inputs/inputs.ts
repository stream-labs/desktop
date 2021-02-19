import { InputProps } from 'antd/lib/input';
import { Ref, useEffect, RefObject, useRef, useContext, ChangeEvent, FocusEvent } from 'react';
import { Input } from 'antd';
import { FormContext } from './ContextForm';
import { useOnCreate } from '../../hooks';
import uuid from 'uuid';
import { FormItemProps } from 'antd/lib/form';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import omit from 'lodash/omit';
import { $t } from '../../../services/i18n';
import { pick } from 'lodash';
/**
 * Shared code for inputs
 */

type TInputType = 'text' | 'textarea' | 'toggle' | 'checkbox' | 'list' | 'tags' | 'switch';

export interface IInputCommonProps<TValue> {
  value?: TValue;
  name?: string;
  nowrap?: boolean;
  onChange?: (val: TValue, ev?: ChangeEvent | CheckboxChangeEvent) => unknown;
  required?: boolean;
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
 *
 * This hook does not handle 'onChange' events because it may be different for each Input component.
 * You should define onChange handler in the component itself or use specific hooks like useTextInput() instead
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
  const form = formContext?.form;

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
    ...pick(inputProps, ['className', 'style', 'key', 'label', 'colon', 'extra', 'labelCol', 'wrapperCol']),
    rules,
    'data-role': 'input-wrapper',
    name: inputId,
  };

  const inputAttrs = {
    ...(pick(inputProps, 'value', antFeatures || []) as {}),
    ...dataAttrs,
    'data-role': 'input',
    name: inputId,
  };

  return {
    inputAttrs,
    wrapperAttrs,
  };
}

/**
 * Hook for text fields: input, textarea, password
 * Use useInput() under the hood and handles the onChange event
 */
export function useTextInput(
  p: Parameters<typeof useInput>[1] & TSlobsInputProps<InputProps, string>,
  antFeatures?: Parameters<typeof useInput>[2],
) {
  const { inputAttrs, wrapperAttrs } = useInput('text', p, antFeatures);

  const onChange = (ev: ChangeEvent<any>) => {
    // Text inputs are uncontrolled by default for better performance
    // onChange handles by onBlur
    // use the `onInput` event if you need to handle any keypress
  };

  const onBlur = (ev: FocusEvent<any>) => {
    // for uncontrolled components call the onInput() handler on blur
    p.onChange && p.onChange(ev.target.value, ev);
    p.onBlur && p.onBlur(ev);
  };

  return {
    wrapperAttrs,
    inputAttrs: {
      ...inputAttrs,
      onChange,
      onBlur,
    },
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
