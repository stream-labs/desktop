import { Select, Row, Col } from 'antd';
import React, { useContext, ReactNode } from 'react';
import { TSlobsInputProps, useInput, ValuesOf } from './inputs';
import InputWrapper from './InputWrapper';
import { SelectProps, OptionProps } from 'antd/lib/select';

// select which features from the antd lib we are going to use
const ANT_SELECT_FEATURES = [
  'showSearch',
  'loading',
  'placeholder',
  'onSearch',
  'notFoundContent',
  'onDropdownVisibleChange',
] as const;

// define custom props
export interface ICustomListProps {
  hasImage?: boolean;
  imageSize?: { width: number; height: number };
  optionRender?: (opt: IOption) => ReactNode;
  labelRender?: (opt: IOption) => ReactNode;
  options: IOption[];
}

// define a type for the component's props
type TProps = TSlobsInputProps<
  ICustomListProps,
  string,
  SelectProps<string>,
  ValuesOf<typeof ANT_SELECT_FEATURES>
>;

/**
 * data for a single option
 */
export interface IOption {
  label: string;
  value: string;
  description?: string; // TODO
  image?: string;
}

export function ListInput(p: TProps) {
  const { inputAttrs, wrapperAttrs } = useInput('list', p, ANT_SELECT_FEATURES);
  const options = p.options;

  function render() {
    return (
      <InputWrapper {...wrapperAttrs}>
        <Select
          {...inputAttrs}
          // search by label instead value
          optionFilterProp="label"
          optionLabelProp="labelrender"
          // convert onSelect into onInput to fit Inputs shape
          onSelect={(val: string) => p.onInput && p.onInput(val)}
        >
          {options && options.map((opt, ind) => renderOption(opt, ind, p))}
        </Select>
      </InputWrapper>
    );
  }

  return render();
}

export function renderOption(opt: IOption, ind: number, inputProps: ICustomListProps) {
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

function renderOptionWithImage(opt: IOption, inputProps: ICustomListProps) {
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

function renderLabelWithImage(opt: IOption) {
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
