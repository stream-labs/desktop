import React from 'react';
import { InputComponent, TSlobsInputProps, useInput, ValuesOf } from './inputs';
import { Slider, InputNumber, Row, Col } from 'antd';
import { SliderSingleProps } from 'antd/lib/slider';
import InputWrapper from './InputWrapper';
import omit from 'lodash/omit';

// select which features from the antd lib we are going to use
const ANT_SLIDER_FEATURES = ['min', 'max', 'step', 'tooltipPlacement', 'tipFormatter'] as const;

export type TSliderInputProps = TSlobsInputProps<
  { hasNumberInput?: boolean; slimNumberInput?: boolean; divisor?: number },
  number,
  SliderSingleProps,
  ValuesOf<typeof ANT_SLIDER_FEATURES>
>;

export const SliderInput = InputComponent((partialProps: TSliderInputProps) => {
  // apply default props
  const p = {
    hasNumberInput: false,
    ...partialProps,
  };
  const { inputAttrs, wrapperAttrs, dataAttrs } = useInput('slider', p, ANT_SLIDER_FEATURES);
  const numberInputHeight = p.slimNumberInput ? '50px' : '70px';

  function onChangeHandler(val: number) {
    // don't emit onChange if the value is out of range
    if (typeof val !== 'number') return;
    if (typeof p.max === 'number' && val > p.max) return;
    if (typeof p.min === 'number' && val < p.min) return;
    if (p.divisor) return inputAttrs.onChange(val * p.divisor);
    inputAttrs.onChange(val);
  }

  return (
    <InputWrapper {...wrapperAttrs}>
      <Row>
        <Col flex="auto" {...dataAttrs} data-role="input" data-value={inputAttrs.value}>
          <Slider
            {...inputAttrs}
            onChange={onChangeHandler}
            value={p.divisor ? Math.floor(inputAttrs.value / p.divisor) : inputAttrs.value}
          />
        </Col>

        {p.hasNumberInput && (
          <Col flex={numberInputHeight}>
            <InputNumber
              // Antd passes tooltipPlacement onto a DOM element when passed as
              // a prop to InputNumber, which makes React complain. It's not a
              // valid prop for InputNumber anyway, so we just omit it.
              {...omit(inputAttrs, 'tooltipPlacement')}
              onChange={onChangeHandler}
              value={p.divisor ? Math.floor(inputAttrs.value / p.divisor) : inputAttrs.value}
              style={{ width: numberInputHeight, marginLeft: '8px' }}
            />
          </Col>
        )}
      </Row>
    </InputWrapper>
  );
});
