import { Checkbox } from 'antd';
import React from 'react';
import { InputComponent, TSlobsInputProps, useInput } from './inputs';
import { CheckboxProps } from 'antd/lib/checkbox';

export type TCheckboxInputProps = TSlobsInputProps<{}, boolean, CheckboxProps>;

export const CheckboxInput = InputComponent((p: TCheckboxInputProps) => {
  const { inputAttrs } = useInput('checkbox', p);
  return (
    <div>
      <Checkbox
        {...inputAttrs}
        checked={inputAttrs.value}
        onChange={() => inputAttrs.onChange(!inputAttrs.value)}
      >
        {p.label}
      </Checkbox>
    </div>
  );
});
