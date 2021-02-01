import { Checkbox } from 'antd';
import React from 'react';
import { TCombinedProps, useInput } from './inputs';
import { CheckboxProps } from 'antd/lib/checkbox';

export function CheckboxInput(p: TCombinedProps<CheckboxProps, boolean>) {
  const { inputAttrs } = useInput('checkbox', p);
  return (
    <div>
      <Checkbox
        checked={p.value}
        {...inputAttrs}
        onChange={ev => p.onInput && p.onInput(!p.value, ev)}
      >
        {p.label}
      </Checkbox>
    </div>
  );
}
