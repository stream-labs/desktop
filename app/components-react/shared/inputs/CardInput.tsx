import { Col, Row } from 'antd';
import React from 'react';
import { InputComponent, TSlobsInputProps, useInput } from './inputs';
import { IListOption } from './ListInput';
import InputWrapper from './InputWrapper';

export type TCardInputProps<TValue> = TSlobsInputProps<
  { options: IListOption<TValue>[]; itemWidth?: number; itemHeight?: number; isIcons?: boolean },
  TValue
>;

/**
 * Allows to pick image cards
 */
export const CardInput = InputComponent((props: TCardInputProps<string>) => {
  const defaultProps = { itemWidth: 64, itemHeight: 64 };
  const p = { ...defaultProps, ...props };
  const { inputAttrs, wrapperAttrs } = useInput('card', p);

  function renderOption(opt: IListOption<string>) {
    const isSelected = opt.value === inputAttrs.value;
    const style = {
      backgroundColor: isSelected ? 'var(--link-active)' : 'var(--solid-input)',
      cursor: 'pointer',
      width: p.isIcons ? p.itemWidth : undefined,
      height: p.isIcons ? p.itemHeight : undefined,
      ...p.style,
    };

    const width = `${p.itemWidth}px`;
    const height = `${p.itemHeight}px`;

    return (
      <Col onClick={() => inputAttrs.onChange(opt.value)} style={style} key={opt.value}>
        {!p.isIcons && <img src={opt.label} style={{ width, height }} />}
        {p.isIcons && (
          <i
            className={opt.label}
            style={{
              fontSize: Math.round(p.itemWidth * 0.6),
              padding: Math.round(p.itemWidth * 0.2),
              display: 'block',
            }}
          />
        )}
      </Col>
    );
  }
  return (
    <InputWrapper {...wrapperAttrs}>
      <Row justify="start">{p.options.map(renderOption)}</Row>
    </InputWrapper>
  );
});
