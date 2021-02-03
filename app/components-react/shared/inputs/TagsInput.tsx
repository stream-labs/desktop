import { Select } from 'antd';
import React, { useContext, ReactNode } from 'react';
import { TCombinedProps, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { SelectProps, OptionProps } from 'antd/lib/select';
import { omit } from 'lodash';

type TTagOption = Omit<OptionProps, 'children'> & {
  label: string;
  template?: (opt: TTagOption) => ReactNode;
};
type TUnresolvedProps = TCombinedProps<SelectProps<string[]>, string[]>;
type TTagsProps = Omit<TUnresolvedProps, 'defaultValue' | 'options'> & {
  options: TTagOption[];
};

export function TagsInput(p: TTagsProps) {
  const { inputAttrs, wrapperAttrs } = useInput('tags', p);
  const options = p.options;
  const calculatedInputAttrs = omit(inputAttrs, 'options', 'children', 'onInput');
  const calculatedWrapperAttrs = omit(
    wrapperAttrs,
    'showSearch',
    'loading',
    'options',
    'tagRender',
    'onInput',
  );

  function render() {
    return (
      <InputWrapper {...calculatedWrapperAttrs}>
        <Select
          // search by label instead value
          optionFilterProp={'label'}
          mode={'multiple'}
          {...calculatedInputAttrs}
          onChange={onChangeHandler}
        >
          {options.map((opt, ind) => (
            <Select.Option {...opt} value={opt.value} key={`${ind}-${opt.value}`}>
              {(opt.template && opt.template(opt)) || opt.label}
            </Select.Option>
          ))}
        </Select>
      </InputWrapper>
    );
  }

  function onChangeHandler(value: string[], opt: OptionProps) {
    // convert onChange into onInput to fit Inputs shape
    p.onChange && p.onChange(value, opt);
    p.onInput && p.onInput(value);
  }

  return render();
}

function getOptionDataAttrs(p: { label: string; value: string }) {
  return {
    'data-option-label': p.label,
    'data-option-value': p.value,
  };
}
