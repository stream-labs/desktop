import React from 'react';
import { InputComponent, TSlobsInputProps } from './inputs';
import InputWrapper from './InputWrapper';
import { Radio, Space } from 'antd';

type TRadioInputProps = TSlobsInputProps<
  { options: { value: string; label: string; description?: string }[]; buttons?: boolean },
  string,
  {}
>;

export const RadioInput = InputComponent((p: TRadioInputProps) => {
  return (
    <InputWrapper label={p.label}>
      {p.buttons && (
        <Radio.Group
          value={p.value}
          onChange={e => p.onChange && p.onChange(e.target.value)}
          options={p.options}
          optionType="button"
          buttonStyle="solid"
        />
      )}
      {!p.buttons && (
        <Radio.Group value={p.value} onChange={e => p.onChange && p.onChange(e.target.value)}>
          <Space direction="vertical">
            {p.options.map(option => {
              return (
                <Radio key={option.value} value={option.value}>
                  {option.label}
                  {option.description && <br />}
                  {option.description && (
                    <span style={{ marginLeft: 24, fontSize: 12 }}>{option.description}</span>
                  )}
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
      )}
    </InputWrapper>
  );
});
