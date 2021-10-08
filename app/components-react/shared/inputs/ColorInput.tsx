import React, { ChangeEvent, RefObject, useEffect, useRef, useState } from 'react';
import { TSlobsInputProps, useInput } from './inputs';
import { Button, Col, Collapse, Input, Popover, Row, Select, Tooltip } from 'antd';
import { SketchPicker } from 'react-color';
import InputWrapper from './InputWrapper';
import { omit } from 'lodash';
import { getOS, OS } from '../../../util/operating-systems';
import { $t } from '../../../services/i18n';
import { loadColorPicker } from '../../../util/slow-imports';
import { Services } from '../../service-provider';
import { HexColorPicker } from 'react-colorful';
import { findDOMNode } from 'react-dom';
import { getDefined } from '../../../util/properties-type-guards';

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
  const color = inputAttrs.value;
  const divAttrs = omit(inputAttrs, 'onChange');
  const [textInputVal, setTextInputVal] = useState(inputAttrs.value);

  useEffect(() => {
    setTextInputVal(inputAttrs.value);
  }, [inputAttrs.value]);

  // open eydrop picker
  async function eyedrop(e: React.MouseEvent) {
    e.stopPropagation();
    const colorPicker = (await loadColorPicker()).default;
    Services.UsageStatisticsService.actions.recordFeatureUsage('screenColorPicker');
    colorPicker.startColorPicker(
      (data: { event: string; hex: string }) => {
        if (data.event === 'mouseClick') {
          inputAttrs.onChange(`#${data.hex}`);
        }
      },
      () => {},
      { onMouseMoveEnabled: true, showPreview: true, showText: false, previewSize: 35 },
    );
  }

  // find the form element in parents and use it as a popup container
  const $formRef = useRef<HTMLElement | null>(null);
  const ref: RefObject<Input> = useRef(null);
  useEffect(() => {
    const $input: Element = findDOMNode(ref.current);
    const $form = $input.closest('[data-role="form"]') as HTMLElement;
    $formRef.current = $form;
  }, []);

  function getPopupContainer() {
    return getDefined($formRef.current);
  }

  function onTextInputChange(ev: ChangeEvent<any>) {
    const color = ev.target.value;
    setTextInputVal(color);
    const isValidColor = color.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/);
    if (!isValidColor) return;
    inputAttrs.onChange(color.toLowerCase());
  }

  function onTextInputBlur() {
    // reset invalid color
    const validColor = inputAttrs.value;
    if (textInputVal !== validColor) setTextInputVal(validColor);
  }

  return (
    <InputWrapper {...wrapperAttrs}>
      <Popover
        content={<HexColorPicker color={inputAttrs.value} onChange={inputAttrs.onChange} />}
        trigger="click"
        placement="bottomLeft"
        getPopupContainer={getPopupContainer}
        overlayStyle={{ marginTop: '-20px' }}
      >
        <Input
          {...divAttrs}
          value={textInputVal}
          onChange={onTextInputChange}
          onBlur={onTextInputBlur}
          ref={ref}
          prefix={
            <span style={{ width: '22px' }}>
              <div
                style={{
                  backgroundColor: color,
                  position: 'absolute',
                  borderRadius: '2px',
                  left: '2px',
                  bottom: '2px',
                  width: '26px',
                  top: '2px',
                }}
              />
            </span>
          }
          addonAfter={
            getOS() === OS.Windows ? (
              <Button title={$t('Pick Screen Color')} style={{ padding: '4px 9px' }}>
                <i className="fas fa-eye-dropper" onClick={eyedrop} />
              </Button>
            ) : (
              false
            )
          }
        />
      </Popover>
    </InputWrapper>
  );
}
