import { ICustomField, useWidget } from './useWidget';
import Form from '../../shared/inputs/Form';
import {
  ColorInput,
  ListInput,
  MediaUrlInput,
  AudioUrlInput,
  SliderInput,
  TextInput,
} from '../../shared/inputs';
import React from 'react';
import { Button, Collapse } from 'antd';
import { $t } from '../../../services/i18n';
import InputWrapper from '../../shared/inputs/InputWrapper';
import { assertIsDefined } from '../../../util/properties-type-guards';

/**
 * Renders a collapsable section with custom fields controls
 */
export function CustomFieldsSection() {
  const { openCustomCodeEditor } = useWidget();
  return (
    <Collapse bordered={false}>
      <Collapse.Panel header={$t('Custom Fields')} key={1}>
        <CustomFields />
        <InputWrapper>
          <Button onClick={openCustomCodeEditor}>Add or Remove Fields</Button>
        </InputWrapper>
      </Collapse.Panel>
    </Collapse>
  );
}

/**
 * Renders custom fields controls
 */
export function CustomFields() {
  const { customCode, updateCustomCode } = useWidget();
  assertIsDefined(customCode);
  const json = customCode.custom_json || {};

  function onFieldChange(fieldName: string, value: any) {
    const newFieldProps = { ...json[fieldName], value };
    updateCustomCode({ custom_json: { ...json, [fieldName]: newFieldProps } });
  }

  const fieldsProps = Object.keys(json).map(name => ({
    name,
    ...json[name],
    onChange: (value: any) => {
      onFieldChange(name, value);
    },
  }));

  return (
    <Form layout="horizontal">
      {fieldsProps.map(props => (
        <CustomField {...props} key={props.name} />
      ))}
    </Form>
  );
}

/**
 * Renders a single custom field control
 */
function CustomField(p: ICustomField & { name: string; onChange: (val: any) => unknown }) {
  const commonProps = { name: p.name, label: p.label, value: p.value, onChange: p.onChange };

  switch (p.type) {
    case 'colorpicker':
      return <ColorInput {...commonProps} />;

    case 'slider':
      return <SliderInput {...commonProps} min={p.min} max={p.max} step={p.steps} debounce={500} />;

    case 'textfield':
      return <TextInput {...commonProps} />;

    case 'dropdown':
      return (
        <ListInput
          {...commonProps}
          options={Object.keys(p.options!).map(key => ({ value: key, label: p.options![key] }))}
        />
      );

    case 'sound-input':
      return <AudioUrlInput {...commonProps} />;
    case 'image-input':
      return <MediaUrlInput {...commonProps} />;
    default:
      return <></>;
  }
}

export const DEFAULT_CUSTOM_FIELDS: Record<string, ICustomField> = {
  customField1: {
    label: 'Color Picker Example',
    type: 'colorpicker',
    value: '#000EF0',
  },

  customField2: {
    label: 'Slider Example',
    type: 'slider',
    value: 100,
    max: 200,
    min: 100,
    steps: 4,
  },

  customField3: {
    label: 'Textfield Example',
    type: 'textfield',
    value: 'Hi There',
  },

  customField4: {
    label: 'Font Picker Example',
    type: 'fontpicker',
    value: 'Open Sans',
  },

  customField5: {
    label: 'Dropdown Example',
    type: 'dropdown',
    options: {
      optionA: 'Option A',
      optionB: 'Option B',
      optionC: 'Option C',
    },
    value: 'optionB',
  },

  customField6: {
    label: 'Image Input Example',
    type: 'image-input',
    value: null,
  },

  customField7: {
    label: 'Sound Input Example',
    type: 'sound-input',
    value: null,
  },
};
