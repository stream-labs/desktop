import React, { useState } from 'react';
import { AutoComplete } from 'antd';
import { InputComponent } from './inputs';
import InputWrapper from './InputWrapper';
import { TListInputProps } from './ListInput';

export const AutocompleteInput = InputComponent(<T extends any>(p: TListInputProps<T>) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleChange(val: string) {
    if (p.onChange) {
      p.onChange(val as T);
    }
  }

  return (
    <InputWrapper label={p.label} rules={p.rules} name={p.name}>
      <AutoComplete
        options={p.options as { label: string; value: string }[]}
        value={p.value as string}
        onFocus={() => setDropdownOpen(true)}
        onBlur={() => setDropdownOpen(false)}
        open={dropdownOpen}
        onChange={handleChange}
        onSelect={handleChange}
        data-value={p.value}
      />
    </InputWrapper>
  );
});
