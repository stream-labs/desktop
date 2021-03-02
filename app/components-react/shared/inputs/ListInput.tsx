import { Select, Row, Col } from 'antd';
import React, { ReactNode } from 'react';
import { InputComponent, TSlobsInputProps, useInput, ValuesOf } from './inputs';
import InputWrapper from './InputWrapper';
import { SelectProps } from 'antd/lib/select';
import { useDebounce } from '../../hooks';

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
export interface ICustomListProps {
  hasImage?: boolean;
  imageSize?: { width: number; height: number };
  optionRender?: (opt: IListOption) => ReactNode;
  labelRender?: (opt: IListOption) => ReactNode;
  options: IListOption[];
}

// define a type for the component's props
export type TListInputProps = TSlobsInputProps<
  ICustomListProps,
  string,
  SelectProps<string>,
  ValuesOf<typeof ANT_SELECT_FEATURES>
>;

/**
 * data for a single option
 */
export interface IListOption {
  label: string;
  value: string;
  description?: string; // TODO
  image?: string;
}

export const ListInput = InputComponent((p: TListInputProps) => {
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
          {...inputAttrs}
          // search by label instead value
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
});

export function renderOption(opt: IListOption, ind: number, inputProps: ICustomListProps) {
  const attrs = {
    'data-option-label': opt.label,
    'data-option-value': opt.value,
    label: opt.label,
    value: opt.value,
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

function renderOptionWithImage(opt: IListOption, inputProps: ICustomListProps) {
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

function renderLabelWithImage(opt: IListOption) {
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
