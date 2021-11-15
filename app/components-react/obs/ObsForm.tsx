import React from 'react';
import { ISettingsSubCategory } from '../../services/settings';
import {
  IObsInput,
  IObsListInput,
  TObsFormData,
  TObsValue,
  IObsPathInputValue,
  IObsSliderInputValue,
  IObsTextInputValue,
  IObsNumberInputValue,
} from '../../components/obs/inputs/ObsInput';
import Form, { useFormContext } from '../shared/inputs/Form';
import {
  CheckboxInput,
  ColorInput,
  FileInput,
  ListInput,
  NumberInput,
  SliderInput,
  TextAreaInput,
  TextInput,
  TInputLayout,
} from '../shared/inputs';
import { cloneDeep } from 'lodash';
import { Button } from 'antd';
import InputWrapper from '../shared/inputs/InputWrapper';
import { $t, $translateIfExist } from '../../services/i18n';
import Utils from 'services/utils';

interface IObsFormProps {
  value: IObsInput<TObsValue>[];
  onChange: (newValue: IObsInput<TObsValue>[]) => unknown;
  layout?: TInputLayout;
  style?: React.CSSProperties;
}

/**
 * Renders a form with OBS inputs
 */
export function ObsForm(p: IObsFormProps) {
  function onInputHandler(value: IObsInput<TObsValue>, index: number) {
    const newValue = cloneDeep(p.value);
    newValue.splice(index, 1, value);

    p.onChange(newValue);
  }

  return (
    <Form layout={p.layout || 'vertical'} style={p.style}>
      {p.value.map((inputData, inputIndex) => (
        <ObsInput
          value={inputData}
          key={inputData.name}
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

/**
 * Renders a single OBS input
 */
function ObsInput(p: IObsInputProps) {
  const formContext = useFormContext();
  const layout = formContext?.layout;
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
    label: $translateIfExist(p.value.description),
    uncontrolled: false,
  };

  switch (type) {
    case 'OBS_PROPERTY_DOUBLE':
      return <NumberInput {...inputProps} />;
    case 'OBS_PROPERTY_INT':
      // eslint-disable-next-line no-case-declarations
      const intVal = inputProps.value as IObsNumberInputValue;

      return <NumberInput {...inputProps} step={1} min={intVal.minVal} max={intVal.maxVal} />;
    case 'OBS_PROPERTY_EDIT_TEXT':
    case 'OBS_PROPERTY_TEXT':
      // eslint-disable-next-line no-case-declarations
      const textVal = inputProps.value as IObsTextInputValue;

      if (textVal.multiline) {
        return <TextAreaInput {...inputProps} />;
      } else {
        return <TextInput {...inputProps} />;
      }
    case 'OBS_PROPERTY_LIST':
      // eslint-disable-next-line no-case-declarations
      const options = (p.value as IObsListInput<unknown>).options.map(opt => {
        // treat 0 as an non-selected option if the description is empty
        if (opt.value === 0 && opt.description === '') {
          return { label: $t('Select Option'), value: 0 };
        }
        return {
          value: opt.value,
          label: $translateIfExist(opt.description),
        };
      });
      return <ListInput {...inputProps} options={options} />;

    case 'OBS_PROPERTY_BUTTON':
      return (
        <InputWrapper>
          <Button onClick={() => inputProps.onChange(true)}>{inputProps.label}</Button>
        </InputWrapper>
      );

    case 'OBS_PROPERTY_BOOL':
      return (
        <InputWrapper style={{ marginBottom: '8px' }} nowrap={layout === 'vertical'}>
          <CheckboxInput {...inputProps} />
        </InputWrapper>
      );

    case 'OBS_PROPERTY_FILE':
      return <FileInput {...inputProps} filters={(p.value as IObsPathInputValue).filters} />;

    case 'OBS_PROPERTY_COLOR':
      // eslint-disable-next-line no-case-declarations
      const rgba = Utils.intToRgba(p.value.value as number);
      rgba.a = rgba.a / 255;

      return (
        <ColorInput
          {...inputProps}
          value={rgba}
          onChange={(v: any) => {
            inputProps.onChange(Utils.rgbaToInt(v.r, v.g, v.b, Math.round(v.a * 255)));
          }}
        />
      );

    case 'OBS_PROPERTY_SLIDER':
      // eslint-disable-next-line no-case-declarations
      const sliderVal = p.value as IObsSliderInputValue;

      // TODO: usePercentages is not hooked up yet
      return (
        <SliderInput
          {...inputProps}
          step={sliderVal.stepVal}
          min={sliderVal.minVal}
          max={sliderVal.maxVal}
          hasNumberInput={true}
          debounce={500}
          tooltipPlacement="right"
        />
      );

    default:
      return <span style={{ color: 'red' }}>Unknown input type {type}</span>;
  }
}

interface IObsFormGroupProps {
  categoryName?: string;
  value: ISettingsSubCategory[];
  onChange: (newValue: ISettingsSubCategory[]) => unknown;
}

/**
 * Renders a group of OBS forms
 */
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
        <div className="section" key={`${sectionProps.nameSubCategory}${ind}`}>
          {sectionProps.nameSubCategory !== 'Untitled' && (
            <h2 className="section-title">{$t(sectionProps.nameSubCategory)}</h2>
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
