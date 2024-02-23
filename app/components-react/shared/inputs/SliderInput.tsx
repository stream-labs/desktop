import React from 'react';
import { InputComponent, TSlobsInputProps, useInput, ValuesOf } from './inputs';
import { Slider, InputNumber, Row, Col } from 'antd';
import { SliderSingleProps } from 'antd/lib/slider';
import InputWrapper from './InputWrapper';
import omit from 'lodash/omit';
import { useThrottle } from '../../hooks';

// select which features from the antd lib we are going to use
const ANT_SLIDER_FEATURES = ['min', 'max', 'step', 'tooltipPlacement', 'tipFormatter'] as const;

// Debounce doesn't make really sense for the slider and is not implemented at the moment
// That's why it is in the Omit list below
export type TSliderInputProps = Omit<TSlobsInputProps<
  {
    hasNumberInput?: boolean;
    slimNumberInput?: boolean;
    usePercentages?: boolean;
    tipFormatter?: (value: number) => React.ReactNode;
  },
  number,
  SliderSingleProps,
  ValuesOf<typeof ANT_SLIDER_FEATURES>
>, 'debounce'>;

export const SliderInput = InputComponent((partialProps: TSliderInputProps) => {
  // apply default props
  const p = {
    hasNumberInput: false,
    ...partialProps,
  };
  const { inputAttrs, wrapperAttrs, dataAttrs } = useInput('slider', p, ANT_SLIDER_FEATURES);
  const numberInputHeight = p.slimNumberInput ? '50px' : '70px';

  function onChange(val: number) {
    inputAttrs.onChange && inputAttrs.onChange(val);
  }
  const throttledOnChange = useThrottle(p.throttle, onChange);

  function onChangeHandler(val: number) {
    // don't emit onChange if the value is out of range
    if (typeof val !== 'number') return;
    if (typeof p.max === 'number' && val > p.max) return;
    if (typeof p.min === 'number' && val < p.min) return;

    if (p.throttle) {
      throttledOnChange(val);
    } else {
      onChange(val);
    }
  }

  function tipFormatter(value: number) {
    if (p.tipFormatter) return p.tipFormatter(value);
    if (p.usePercentages) return `${value * 100}%`;
    return value;
  }

  return (
    <InputWrapper {...wrapperAttrs}>
      <Row>
        <Col flex="auto" {...dataAttrs} data-role="input" data-value={inputAttrs.value}>
          <Slider {...inputAttrs} onChange={onChangeHandler} tipFormatter={tipFormatter} />
        </Col>

        {p.hasNumberInput && (
          <Col flex={numberInputHeight}>
            <InputNumber
              // Antd passes tooltipPlacement onto a DOM element when passed as
              // a prop to InputNumber, which makes React complain. It's not a
              // valid prop for InputNumber anyway, so we just omit it.
              {...omit(inputAttrs, 'tooltipPlacement')}
              onChange={onChangeHandler}
              style={{ width: numberInputHeight, marginLeft: '8px' }}
            />
          </Col>
        )}
      </Row>
    </InputWrapper>
  );
});
