import React from 'react';
import InputWrapper from '../shared/inputs/InputWrapper';
import { injectState, useModule } from 'slap';
import { ListInput, NumberInput } from '../shared/inputs';
import { $t } from '../../services/i18n';
import { Button, Col, Row } from 'antd';

export function CustomResolutionInput(p: {
  value: string;
  onChange: (newVal: string) => unknown;
  name: string;
  label: string;
  options: { description: string; value: string }[];
}) {
  const options = p.options.map(opt => ({ label: opt.description, value: opt.value }));
  const { isCustomMode, toggleCustomMode, applyCustom, bind } = useModule(() => {
    const state = injectState({
      width: 0,
      height: 0,
      isCustomMode: false,
      toggleCustomMode() {
        this.isCustomMode = !this.isCustomMode;
        const res = parseResolution(p.value);
        this.width = res.width;
        this.height = res.height;
      },
    });

    function applyCustom() {
      state.setIsCustomMode(false);
      const width = Math.max(state.width, 1);
      const height = Math.max(state.height, 1);
      const value = `${width}x${height}`;
      p.onChange(value);
    }

    return { state, applyCustom };
  });

  return (
    <InputWrapper label={p.label}>
      {!isCustomMode && (
        <Row>
          <Col flex="auto">
            <ListInput
              options={options}
              name={p.name}
              value={p.value}
              nowrap
              onChange={p.onChange}
            />
          </Col>
          <Col>
            <Button onClick={toggleCustomMode}>{$t('Use Custom')}</Button>
          </Col>
        </Row>
      )}

      {isCustomMode && (
        <Col flex="auto">
          <NumberInput label={$t('Width')} min={8} max={32 * 1024} {...bind.width} />
          <NumberInput label={$t('Height')} min={8} max={32 * 1024} {...bind.height} />
          <Button onClick={applyCustom}>{$t('Apply')}</Button>
        </Col>
      )}
    </InputWrapper>
  );
}

function parseResolution(resStr: string): { width: number; height: number } {
  const match = resStr.match(/\d+/g) || [];
  const width = Number(match[0] || 400);
  const height = Number(match[1] || 400);
  return { width, height };
}
