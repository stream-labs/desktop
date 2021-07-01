import { TimePicker, TimePickerProps } from 'antd';
import React, { useCallback } from 'react';
import { InputComponent, TSlobsInputProps, useInput } from './inputs';
import InputWrapper from './InputWrapper';
import moment, { Moment } from 'moment';

export type TTimeInputProps = TSlobsInputProps<{}, number, TimePickerProps>;

export const TimeInput = InputComponent((p: TTimeInputProps) => {
  const { wrapperAttrs, inputAttrs } = useInput('time', p);
  const value = getAntdValue(inputAttrs.value);

  function onChange(moment: Moment) {
    inputAttrs.onChange(moment?.valueOf() || 0);
  }

  return (
    <InputWrapper {...wrapperAttrs}>
      <TimePicker
        {...inputAttrs}
        value={value}
        onSelect={onChange}
        onChange={onChange}
        use12Hours
        format="h:mm a"
        showNow={false}
        allowClear={false}
      />
    </InputWrapper>
  );
});

function getAntdValue(value: number) {
  return moment(value);
}

// tell the Form to convert a timestamp value to a Moment value when call `Form.setFieldsValue`
TimeInput['getAntdValue'] = getAntdValue;
