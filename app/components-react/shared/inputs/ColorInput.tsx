import React, { RefObject, useEffect, useRef, useState } from 'react';
import { TSlobsInputProps, useInput } from './inputs';
import { Button, Col, Collapse, Input, Popover, Row, Select, Tooltip } from 'antd';
import { SketchPicker } from 'react-color';
import InputWrapper from './InputWrapper';
import { omit } from 'lodash';
import { DownOutlined } from '@ant-design/icons';
import { getOS, OS } from '../../../util/operating-systems';
import { $t } from '../../../services/i18n';
import { loadColorPicker } from '../../../util/slow-imports';
import { Services } from '../../service-provider';
import { findDOMNode } from 'react-dom';
import Animation from 'rc-animate';
import { CollapseArea } from '../CollapseArea';

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
  const [isExpanded, setIsExpanded] = useState(false);

  function toggle() {
    setIsExpanded(!isExpanded);
  }

  async function eyedrop(e: React.MouseEvent) {
    e.stopPropagation();
    const colorPicker = (await loadColorPicker()).default;
    Services.UsageStatisticsService.recordFeatureUsage('screenColorPicker');
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

  const ref: RefObject<Input> = useRef(null);
  useEffect(() => {
    const $input: Element = findDOMNode(ref.current);
    // const $picker = $input
    //   .closest('[data-role="input-wrapper"]')!
    //   .querySelector('.sketch-picker') as HTMLElement;
    // if ($picker) $picker.style.backgroundColor = 'var(--section-alt)';
  });

  return (
    <InputWrapper {...wrapperAttrs}>
      <Input
        {...divAttrs}
        value={color}
        contentEditable={false}
        onClick={toggle}
        ref={ref}
        style={{ cursor: 'default', caretColor: 'transparent' }}
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
      <CollapseArea isExpanded={isExpanded}>
        <SketchPicker
          color={inputAttrs.value}
          onChange={color => inputAttrs.onChange && inputAttrs.onChange(color.hex)}
          disableAlpha={true}
          styles={{
            default: {
              picker: {
                background: 'var(--section-alt)',
                color: 'var(--paragraph)',
              },
              controls: {
                color: 'var(--paragraph)',
              },
            },
          }}
        />
      </CollapseArea>
    </InputWrapper>
  );
}
