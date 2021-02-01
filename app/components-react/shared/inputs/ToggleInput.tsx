import { Switch } from 'antd';
import React from 'react';
import { useInput } from './inputs';
import InputWrapper from './InputWrapper';

// TODO
export function ToggleInput(p: any) {
  const { wrapperAttrs } = useInput('toggle', p);
  return (
    <InputWrapper {...wrapperAttrs}>
      <Switch checked={p.value} size="small" />
    </InputWrapper>
  );
}
