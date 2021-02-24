import { Checkbox } from 'antd';
import React from 'react';
import { InputComponent, TSlobsInputProps, useInput } from './inputs';
import { CheckboxProps } from 'antd/lib/checkbox';

export type TCheckboxInputProps = TSlobsInputProps<{}, boolean, CheckboxProps>;

export const CheckboxInput = InputComponent((p: TCheckboxInputProps) => {
  const { inputAttrs, stateRef } = useInput('checkbox', p);
  const value = stateRef.current.value;
  return (
    <div>
      <Checkbox checked={value} {...inputAttrs} onChange={() => inputAttrs.onChange(!value)}>
        {p.label}
      </Checkbox>
    </div>
  );
});
