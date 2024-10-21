import React from 'react';
import { InputComponent, TSlobsInputProps } from './inputs';
import InputWrapper from './InputWrapper';
import { Radio, Space } from 'antd';

type TRadioInputProps = TSlobsInputProps<
  {
    label?: string;
    nolabel?: boolean;
    nomargin?: boolean;
    options: {
      value: string | number;
      label: string;
      description?: string;
      defaultValue?: string;
    }[];
    buttons?: boolean;
    direction?: 'vertical' | 'horizontal';
    disabled?: boolean;
    className?: string;
  },
  string,
  {}
>;

export const RadioInput = InputComponent((p: TRadioInputProps) => {
  return (
    <InputWrapper
      label={p.label}
      nolabel={p.nolabel ?? undefined}
      style={{ margin: p.nomargin ? '0px' : undefined }}
    >
      {p.buttons && (
        <Radio.Group
          value={p.value}
          onChange={e => p.onChange && p.onChange(e.target.value)}
          options={p.options}
          optionType="button"
          buttonStyle="solid"
          disabled={p.disabled}
          className={p.className}
        />
      )}
      {!p.buttons && (
        <Radio.Group
          value={p.value}
          defaultValue={p.defaultValue}
          onChange={e => p.onChange && p.onChange(e.target.value)}
          className={p.className}
        >
          <Space direction={p?.direction ?? 'vertical'}>
            {p.options.map(option => {
              return (
                <Radio key={option.value} value={option.value} disabled={p.disabled}>
                  {option.label}
                  {option.description && <br />}
                  {option.description && <span style={{ fontSize: 12 }}>{option.description}</span>}
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
      )}
    </InputWrapper>
  );
});
