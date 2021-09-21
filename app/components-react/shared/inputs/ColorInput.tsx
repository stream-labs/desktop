import React from 'react';
import { TSlobsInputProps, useInput } from './inputs';
import { Col, Row, Select } from 'antd';
import { SketchPicker } from 'react-color';
import InputWrapper from './InputWrapper';
import { omit } from 'lodash';

export function ColorInput(p: TSlobsInputProps<{}, string>) {
  // const [color, setColor] = useState('#ff0000');
  // return (
  //   <SketchPicker
  //     color={color}
  //     onChange={color => setColor(color.hex)}
  //   />
  // );

  // set default debounce to 500
  const debounce = p.debounce === undefined ? 500 : p.debounce;
  const { wrapperAttrs, inputAttrs } = useInput('color', { ...p, debounce });
  const selectAttrs = omit(inputAttrs, 'onChange');
  return (
    <InputWrapper {...wrapperAttrs}>
      {/*<SketchPicker*/}
      {/*  color={inputAttrs.value}*/}
      {/*  onChange={color => inputAttrs.onChange && inputAttrs.onChange(color.hex)}*/}
      {/*/>*/}
      <Select
        {...selectAttrs}
        value={1}
        // onChange={val => inputAttrs.onChange && inputAttrs.onChange(val)}
        dropdownRender={menu => (
          <div>
            {menu}
            <SketchPicker
              color={inputAttrs.value}
              onChange={color => inputAttrs.onChange && inputAttrs.onChange(color.hex)}
            />
          </div>
        )}
      >
        <Select.Option value={1}>
          {'! '}
          <ColorBox color={inputAttrs.value} />
        </Select.Option>
      </Select>
    </InputWrapper>
  );
}

function ColorBox(p: { color: string }) {
  return (
    <Row gutter={8} align="middle" wrap={false}>
      <Col style={{ backgroundColor: 'red', width: '10px' }}>!</Col>
      <Col>{p.color}</Col>
    </Row>
  );
}
