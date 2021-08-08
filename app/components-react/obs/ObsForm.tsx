import React from 'react';
import { ISettingsSubCategory } from '../../services/settings';
import { IObsInput, TObsFormData, TObsValue } from '../../components/obs/inputs/ObsInput';
import Form from '../shared/inputs/Form';
import { CheckboxInput, NumberInput } from '../shared/inputs';
import { cloneDeep } from 'lodash';

interface IObsFormProps {
  value: IObsInput<TObsValue>[];
  onChange: (newValue: IObsInput<TObsValue>[]) => unknown;
}

export function ObsForm(p: IObsFormProps) {
  function onInputHandler(value: IObsInput<TObsValue>, index: number) {
    const newValue = cloneDeep(p.value);
    newValue.splice(index, 1, value);

    p.onChange(newValue);
  }

  return (
    <Form layout="vertical">
      {p.value.map((inputData, inputIndex) => (
        <ObsInput
          value={inputData}
          key={inputIndex}
          inputIndex={inputIndex}
          onChange={onInputHandler}
        />
      ))}
    </Form>
  );
}

interface IObsInputProps {
  value: IObsInput<TObsValue>;
  inputIndex: number;
  onChange: (newValue: IObsInput<TObsValue>, inputInd: number) => unknown;
}

function ObsInput(p: IObsInputProps) {
  if (!p.value.visible) return <></>;
  const type = p.value.type;

  function onChangeHandler(...args: any[]) {
    const newVal = cloneDeep(p.value);
    newVal.value = args[0] as TObsValue;
    p.onChange(newVal, p.inputIndex);
  }

  const inputProps = {
    value: p.value.value as any,
    onChange: onChangeHandler,
    name: p.value.name,
    label: p.value.description,
  };

  switch (type) {
    case 'OBS_PROPERTY_BOOL':
      return <CheckboxInput {...inputProps} />;
    case 'OBS_PROPERTY_DOUBLE':
      return <NumberInput {...inputProps} />;
    default:
      return <span style={{ color: 'red' }}>Unknown input type {type}</span>;
  }
}

interface IObsFormGroupProps {
  categoryName?: string;
  value: ISettingsSubCategory[];
  onChange: (newValue: ISettingsSubCategory[]) => unknown;
}

export function ObsFormGroup(p: IObsFormGroupProps) {
  function onChangeHandler(formData: TObsFormData, ind: number) {
    const newVal = cloneDeep(p.value);
    newVal[ind].parameters = formData;
    p.onChange(newVal);
  }
  const sections = p.value.filter(section => section.parameters.filter(p => p.visible).length);

  return (
    <div className="form-groups">
      {sections.map((sectionProps, ind) => (
        <div className="section" key={ind}>
          {sectionProps.nameSubCategory !== 'Untitled' && (
            <h2 className="section-title">{sectionProps.nameSubCategory}</h2>
          )}
          <div className="section-content">
            <ObsForm
              value={sectionProps.parameters}
              onChange={formData => onChangeHandler(formData, ind)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
