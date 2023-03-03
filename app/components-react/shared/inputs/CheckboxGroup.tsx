import React from 'react';
import { InputComponent, TSlobsInputProps } from './inputs';
import InputWrapper from './InputWrapper';
import { ICheckboxGroupMetadata } from './metadata';
import { CheckboxInput } from './CheckboxInput';

type TCheckboxGroupProps = TSlobsInputProps<ICheckboxGroupMetadata, boolean>;

export const CheckboxGroup = InputComponent((p: TCheckboxGroupProps) => {
  return (
    <InputWrapper label={p.label} rules={p.rules} name={p.name}>
      {Object.keys(p.children).map(inputKey => {
        const meta = p.children[inputKey];

        return (
          <React.Fragment key={inputKey}>
            <CheckboxInput
              {...meta}
              onChange={p.onChange(inputKey)}
              value={p.values[inputKey] as boolean}
              data-name={inputKey}
              data-value={p.values[inputKey] as boolean}
              data-role="input"
            />
          </React.Fragment>
        );
      })}
    </InputWrapper>
  );
});
