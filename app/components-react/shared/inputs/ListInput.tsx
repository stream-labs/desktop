import { Select } from 'antd';
import React from 'react';
import { TCombinedProps, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import { SelectProps, OptionProps } from 'antd/lib/select';
import { omit } from 'lodash';

type TUnresolvedProps = TCombinedProps<SelectProps<string>, string>;
type TResolvedProps = Omit<TUnresolvedProps, 'onChange' | 'defaultValue'>;

export function ListInput(p: TResolvedProps) {
  const { inputAttrs, wrapperAttrs } = useInput('list', p);
  return (
    <InputWrapper {...omit(wrapperAttrs, 'showSearch')}>
      <Select
        {...inputAttrs}
        optionFilterProp={'label'}
        onSelect={(val: string) => p.onInput && p.onInput(val)}
      />
    </InputWrapper>
  );
}

/**
 * Wraps Select.Option with data-attributes for auto tests
 */
export function Option(p: OptionProps) {
  return <Select.Option {...p} data-option-label={p.label} data-option-value={p.value} />;
}
