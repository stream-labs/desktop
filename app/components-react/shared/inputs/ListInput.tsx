import { Select } from 'antd';
import React, { useContext } from 'react';
import { TSlobsInputProps, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { SelectProps, OptionProps } from 'antd/lib/select';
import { omit } from 'lodash';

interface ICustomListProps {
  hasImage?: boolean;
  imageSize?: { width: number; height: number };
}

type TImageOptionProps = Omit<OptionProps, 'children'> & {
  data?: { image: string };
};

type TUnresolvedProps = TSlobsInputProps<SelectProps<string> & ICustomListProps, string>;
type TResolvedProps = Omit<TUnresolvedProps, 'onChange' | 'defaultValue' | 'children'>;

export function ListInput(p: TResolvedProps) {
  // TODO: extract common code for ListInput and TagsInput
  const { inputAttrs, wrapperAttrs } = useInput('list', p);
  const options = p.options;
  const customAttrs = ['hasImage', 'imageSize'];
  const calculatedInputAttrs = omit(inputAttrs, ...customAttrs, 'options', 'children');
  const calculatedWrapperAttrs = omit(
    wrapperAttrs,
    ...customAttrs,
    'showSearch',
    'loading',
    'options',
  );

  function render() {

    return (
      <InputWrapper {...calculatedWrapperAttrs}>
        <Select
          {...calculatedInputAttrs}
          // search by label instead value
          optionFilterProp={'label'}
          // convert onSelect into onInput to fit Inputs shape
          onSelect={(val: string) => p.onInput && p.onInput(val)}
        >
          {options &&
            options.map((opt, ind) => (
              <Select.Option {...omit(opt, 'el')} value={opt.value} key={`${ind}-${opt.value}`}>
                {p.hasImage && renderOptionWithImage(opt)}
                {!p.hasImage && ((opt.el && opt.el(opt)) || opt.title)}
              </Select.Option>
            ))}
        </Select>
      </InputWrapper>
    );
  }

  function renderOptionWithImage(opt: Omit<OptionProps, 'title'>) {
    const { title } = opt;
    const src = opt.data.image;
    const { width, height } = opt.imageSize ? opt.imageSize : { width: 15, height: 15 };
    const imageStyle = {
      width: `${width}px`,
      height: `${height}px`,
      display: 'inline-block',
    };
    return (
      <>
        {src && <img src={src} alt="" style={imageStyle} />}
        {!src && <div style={imageStyle} />}
        <span>{title}</span>
      </>
    );
  }

  return render();
}

function getOptionDataAttrs(p: { label: string; value: string }) {
  return {
    'data-option-label': p.label,
    'data-option-value': p.value,
  };
}

function Option(p: OptionProps) {
  return <Select.Option {...p} />;
}

// Antd shows a warning if you try to override the Option
// @see https://github.com/ant-design/ant-design/issues/1891
// dismiss that warning by settings `isSelectOption=true`
// Warning! it's not a documented feature
Option.isSelectOption = true;
// ImageOption.isSelectOption = true;
