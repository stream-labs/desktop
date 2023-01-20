import React from 'react';
import { InputComponent, TSlobsInputProps } from './inputs';
import InputWrapper from './InputWrapper';
import { ICheckboxGroupMetadata } from './metadata';
import { CheckboxInput } from './CheckboxInput';

type TCheckboxGroupProps = TSlobsInputProps<ICheckboxGroupMetadata, boolean>;

export const CheckboxGroup = InputComponent((p: TCheckboxGroupProps) => {
  return (
    <InputWrapper label={p.label} rules={p.rules} name={p.name}>
      {Object.keys(p.children).map(key => {
        const meta = p.children[key];

        return <CheckboxInput key={key} {...meta} onChange={p.onChange} />;
      })}
    </InputWrapper>
  );
});
