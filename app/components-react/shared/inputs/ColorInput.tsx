import React, { ChangeEvent, RefObject, useEffect, useRef, useState } from 'react';
import { TSlobsInputProps, useInput } from './inputs';
import { Button, Input, Popover } from 'antd';
import InputWrapper from './InputWrapper';
import { omit } from 'lodash';
import { getOS, OS } from '../../../util/operating-systems';
import { $t } from '../../../services/i18n';
import { loadColorPicker } from '../../../util/slow-imports';
import { Services } from '../../service-provider';
import { HexColorPicker, RgbaColor, RgbaColorPicker } from 'react-colorful';
import { findDOMNode } from 'react-dom';
import { getDefined } from '../../../util/properties-type-guards';
import Utils from '../../../services/utils';

export type TColorInputProps = TSlobsInputProps<{ hasAlpha?: boolean }, string>;

export function ColorInput(p: TColorInputProps) {
  // set default debounce to 500
  const debounce = p.debounce === undefined ? 500 : p.debounce;
  const { wrapperAttrs, inputAttrs } = useInput('color', { ...p, debounce });
  const divAttrs = omit(inputAttrs, 'onChange');
  const [textInputVal, setTextInputVal] = useState(inputAttrs.value);
  const Picker = p.hasAlpha ? RgbaColorPicker : HexColorPicker;

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
    // update textInput state
    const color = ev.target.value;
    setTextInputVal(color);

    // emit onChange if textInput contains a valid color
    const isValidColor = p.hasAlpha
      ? color.match(/^#(?:[0-9a-fA-F]{4}){1,2}$/)
      : color.match(/^#(?:[0-9a-fA-F]{3}){1,2}$/);
    if (!isValidColor) return;
    onChangeHandler(color.toLowerCase());
  }

  function onTextInputBlur() {
    // reset invalid color
    const validColor = inputAttrs.value;
    if (textInputVal !== validColor) setTextInputVal(validColor);
  }

  function onChangeHandler(value: string | RgbaColor) {
    if (typeof value === 'string') {
      inputAttrs.onChange(value);
    } else {
      inputAttrs.onChange(rgbaToHexStr(value));
    }
  }

  return (
    <InputWrapper {...wrapperAttrs}>
      <Popover
        content={
          <Picker
            color={p.hasAlpha ? hexStrToRgba(inputAttrs.value) : inputAttrs.value}
            onChange={onChangeHandler}
          />
        }
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
                  backgroundColor: inputAttrs.value,
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

export function hexStrToRgba(hexStrVal: string): RgbaColor {
  const r = parseInt(hexStrVal.slice(1, 3), 16);
  const g = parseInt(hexStrVal.slice(3, 5), 16);
  const b = parseInt(hexStrVal.slice(5, 7), 16);
  let a = 255;

  if (hexStrVal[8]) {
    a = parseInt(hexStrVal.slice(7, 9), 16);
  }

  return { r, g, b, a: a / 255 };
}

export function intToRgba(intVal: number): RgbaColor {
  const rgba = Utils.intToRgba(intVal);
  return {
    ...rgba,
    a: rgba.a / 255,
  };
}

export function rgbaToHexStr(rgba: RgbaColor): string {
  return `#${
    intTo2hexDigit(rgba.r) +
    intTo2hexDigit(rgba.g) +
    intTo2hexDigit(rgba.b) +
    intTo2hexDigit(Math.ceil(rgba.a * 255))
  }`;
}

export function rgbaToInt(rgba: RgbaColor): number {
  return Utils.rgbaToInt(rgba.r, rgba.g, rgba.b, Math.ceil(rgba.a * 255));
}

export function intToHexStr(intVal: number): string {
  return rgbaToHexStr(intToRgba(intVal));
}

export function hexStrToInt(hexStrVal: string): number {
  return rgbaToInt(hexStrToRgba(hexStrVal));
}

export function intTo2hexDigit(int: number): string {
  let result = int.toString(16);
  if (result.length === 1) result = `0${result}`;
  return result;
}
