import React, { ChangeEvent, RefObject, useEffect, useRef, useState } from 'react';
import { TSlobsInputProps, useInput } from './inputs';
import { Button, Input, Popover } from 'antd';
import InputWrapper from './InputWrapper';
import { omit } from 'lodash';
import { getOS, OS } from '../../../util/operating-systems';
import { $t } from '../../../services/i18n';
import { loadColorPicker } from '../../../util/slow-imports';
import { Services } from '../../service-provider';
import { HexColorPicker, RgbaColorPicker } from 'react-colorful';
import { findDOMNode } from 'react-dom';
import { getDefined } from '../../../util/properties-type-guards';

interface IRGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

function intTo2hexDigit(int: number) {
  let result = int.toString(16);
  if (result.length === 1) result = `0${result}`;
  return result;
}

function rgbaToHex(color: IRGBAColor) {
  return `#${intTo2hexDigit(color.r)}${intTo2hexDigit(color.g)}${intTo2hexDigit(
    color.b,
  )}${intTo2hexDigit(Math.round(color.a * 255))}`;
}

function hexToRGB(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return { r, g, b };
}

function colorToHex(color: string | IRGBAColor) {
  if (typeof color === 'string') return color;

  return rgbaToHex(color);
}

export function ColorInput(p: TSlobsInputProps<{}, string | IRGBAColor>) {
  // set default debounce to 500
  const debounce = p.debounce === undefined ? 500 : p.debounce;
  const { wrapperAttrs, inputAttrs } = useInput('color', { ...p, debounce });
  const divAttrs = omit(inputAttrs, 'onChange');
  const [textInputVal, setTextInputVal] = useState(colorToHex(inputAttrs.value));
  const alphaMode = typeof inputAttrs.value !== 'string';

  useEffect(() => {
    setTextInputVal(colorToHex(inputAttrs.value));
  }, [inputAttrs.value]);

  // open eydrop picker
  async function eyedrop(e: React.MouseEvent) {
    e.stopPropagation();
    const colorPicker = (await loadColorPicker()).default;
    Services.UsageStatisticsService.actions.recordFeatureUsage('screenColorPicker');
    colorPicker.startColorPicker(
      (data: { event: string; hex: string }) => {
        if (data.event === 'mouseClick') {
          if (typeof inputAttrs.value === 'string') {
            inputAttrs.onChange(`#${data.hex}`);
          } else {
            const rgb = hexToRGB(`#${data.hex}`);
            inputAttrs.onChange({ ...rgb, a: inputAttrs.value.a });
          }
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
    // update textInput state
    const color = ev.target.value;
    setTextInputVal(color);

    // emit onChange if textInput contains a valid color
    const isValidColor = alphaMode
      ? color.match(/^#(?:[0-9a-fA-F]{8})$/)
      : color.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/);
    if (!isValidColor) return;
    inputAttrs.onChange(color.toLowerCase());
  }

  function onTextInputBlur() {
    // reset invalid color
    const validColor = colorToHex(inputAttrs.value);
    if (textInputVal !== validColor) setTextInputVal(validColor);
  }

  const picker =
    typeof inputAttrs.value === 'string' ? (
      <HexColorPicker color={inputAttrs.value} onChange={inputAttrs.onChange} />
    ) : (
      <RgbaColorPicker color={inputAttrs.value} onChange={inputAttrs.onChange} />
    );

  return (
    <InputWrapper {...wrapperAttrs}>
      <Popover
        content={picker}
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
          // render color box
          prefix={
            <span style={{ width: '22px' }}>
              <div
                style={{
                  backgroundColor: colorToHex(inputAttrs.value),
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
          // render eyedropper button
          addonAfter={
            getOS() === OS.Windows ? (
              <Button
                title={$t('Pick Screen Color')}
                style={{ padding: '4px 9px' }}
                onClick={eyedrop}
              >
                <i className="fas fa-eye-dropper" />
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
