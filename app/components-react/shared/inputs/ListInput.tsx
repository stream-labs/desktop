import { Select, Row, Col } from 'antd';
import React, { ReactNode } from 'react';
import { InputComponent, TSlobsInputProps, useInput, ValuesOf } from './inputs';
import InputWrapper from './InputWrapper';
import { SelectProps } from 'antd/lib/select';
import { useDebounce } from '../../hooks';
import omit from 'lodash/omit';

// select what features from the antd lib we are going to use
const ANT_SELECT_FEATURES = [
  'showSearch',
  'loading',
  'placeholder',
  'notFoundContent',
  'onDropdownVisibleChange',
  'onSearch',
  'onSelect',
] as const;

// define custom props
export interface ICustomListProps<TValue> {
  hasImage?: boolean;
  imageSize?: { width: number; height: number };
  optionRender?: (opt: IListOption<TValue>) => ReactNode;
  labelRender?: (opt: IListOption<TValue>) => ReactNode;
  options: IListOption<TValue>[];
}

// define a type for the component's props
export type TListInputProps<TValue> = TSlobsInputProps<
  ICustomListProps<TValue>,
  TValue,
  SelectProps<string>,
  ValuesOf<typeof ANT_SELECT_FEATURES>
>;

/**
 * data for a single option
 */
export interface IListOption<TValue> {
  label: string;
  value: TValue;
  description?: string; // TODO
  image?: string;
}

function TempInput<T extends { value: T['value']; options: T['value'][] }>(p: T) {
  return p;
}

const prop = TempInput({ value: 123, options: [123, '123'] });

export const ListInput = <T extends TListInputProps<T['value']>>(p: T) => {
  const { inputAttrs, wrapperAttrs } = useInput('list', p, ANT_SELECT_FEATURES);
  const options = p.options;

  // create onSearch handler and it's debounced version
  const onSearchHandlerDebounced = p.debounce
    ? useDebounce(p.debounce, onSearchHandler)
    : onSearchHandler;

  function render() {
    return (
      <InputWrapper {...wrapperAttrs}>
        <Select
          {...omit(inputAttrs, 'onChange')}
          // search by label instead value
          value={inputAttrs.value as string}
          optionFilterProp="label"
          optionLabelProp="labelrender"
          onSearch={onSearchHandlerDebounced}
          onSelect={(val: string) => p.onChange && p.onChange(val)}
        >
          {options && options.map((opt, ind) => renderOption(opt, ind, p))}
        </Select>
      </InputWrapper>
    );
  }

  function onSearchHandler(searchStr: string) {
    p.onSearch && p.onSearch(searchStr);
  }

  return render();
};

export function renderOption<T>(opt: IListOption<T>, ind: number, inputProps: ICustomListProps<T>) {
  const attrs = {
    'data-option-label': opt.label,
    'data-option-value': opt.value,
    label: opt.label,
    value: (opt.value as unknown) as string,
    key: `${ind}-${opt.value}`,
  };

  const labelEl = (() => {
    if (inputProps.labelRender) {
      return inputProps.labelRender(opt);
    } else if (inputProps.hasImage) {
      return renderLabelWithImage(opt);
    } else {
      return opt.label;
    }
  })();

  const children = (() => {
    if (inputProps.optionRender) {
      return inputProps.optionRender(opt);
    } else if (inputProps.hasImage) {
      return renderOptionWithImage(opt, inputProps);
    } else {
      return opt.label;
    }
  })();

  return (
    <Select.Option {...attrs} labelrender={labelEl}>
      {children}
    </Select.Option>
  );
}

function renderOptionWithImage<T>(opt: IListOption<T>, inputProps: ICustomListProps<T>) {
  const src = opt.image;
  const { width, height } = inputProps.imageSize ? inputProps.imageSize : { width: 15, height: 15 };
  const imageStyle = {
    width: `${width}px`,
    height: `${height}px`,
  };
  return (
    <Row gutter={8} align="middle">
      <Col>
        {src && <img src={src} alt="" style={imageStyle} />}
        {!src && <div style={imageStyle} />}
      </Col>
      <Col>{opt.label}</Col>
    </Row>
  );
}

function renderLabelWithImage<T>(opt: IListOption<T>) {
  const src = opt.image;
  const [width, height] = [15, 15];
  const imageStyle = {
    width: `${width}px`,
    height: `${height}px`,
  };
  return (
    <Row gutter={8}>
      <Col>
        {src && <img src={src} alt="" style={imageStyle} />}
        {!src && <div style={imageStyle} />}
      </Col>
      <Col>{opt.label}</Col>
    </Row>
  );
}

const i = ListInput({ value: 1, options: [{ label: 'opt1', value: 2 }] });
i.value;
