import React, { useMemo, useState } from 'react';
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
  IObsBitmaskInput,
  IObsListOption,
} from '../../components/obs/inputs/ObsInput';
import Form, { useForm, useFormContext } from '../shared/inputs/Form';
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
import { IObsFormType } from '../windows/settings/ObsSettings';
import cloneDeep from 'lodash/cloneDeep';
import { Button, Collapse } from 'antd';
import InputWrapper from '../shared/inputs/InputWrapper';
import { $t, $translateIfExist, $translateIfExistWithCheck } from '../../services/i18n';
import Utils from 'services/utils';
import cx from 'classnames';
import * as obs from '../../../obs-api';
import Tabs from 'components-react/shared/Tabs';
interface IExtraInputProps {
  debounce?: number;
}

export interface IObsFormProps {
  value: IObsInput<TObsValue>[];
  onChange: (newValue: IObsInput<TObsValue>[], changedInd: number) => unknown;
  layout?: TInputLayout;
  style?: React.CSSProperties;
  extraProps?: Record<string, IExtraInputProps>;
}

/**
 * Renders a form with OBS inputs
 */
export function ObsForm(p: IObsFormProps) {
  function onInputHandler(value: IObsInput<TObsValue>, index: number) {
    const newValue = cloneDeep(p.value);
    newValue.splice(index, 1, value);

    p.onChange(newValue, index);
  }

  return (
    <Form layout={p.layout || 'vertical'} style={p.style}>
      {p.value.map((inputData, inputIndex) => (
        <ObsInput
          value={inputData}
          key={inputData.name}
          inputIndex={inputIndex}
          onChange={onInputHandler}
          extraProps={p.extraProps?.[inputData.name]}
        />
      ))}
    </Form>
  );
}

interface IObsInputProps {
  value: IObsInput<TObsValue>;
  inputIndex: number;
  onChange: (newValue: IObsInput<TObsValue>, inputInd: number) => unknown;
  extraProps?: IExtraInputProps;
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

  const extraProps = p.extraProps || {};

  const inputProps = {
    value: p.value.value as any,
    onChange: onChangeHandler,
    name: p.value.name,
    label: $translateIfExist(p.value.description),
    uncontrolled: false,
    masked: p.value.masked,
    disabled: !p.value.enabled,
    ...extraProps,
  };

  switch (type) {
    case 'OBS_PROPERTY_DOUBLE':
      return <NumberInput {...inputProps} />;
    case 'OBS_PROPERTY_INT':
      // eslint-disable-next-line no-case-declarations
      const intVal = p.value as IObsNumberInputValue;

      return <NumberInput {...inputProps} step={1} min={intVal.minVal} max={intVal.maxVal} />;
    case 'OBS_PROPERTY_EDIT_TEXT':
    case 'OBS_PROPERTY_TEXT':
      // eslint-disable-next-line no-case-declarations
      const textVal = p.value as IObsTextInputValue;

      if (textVal.multiline) {
        return <TextAreaInput {...inputProps} debounce={300} />;
      } else if (textVal.infoField) {
        const infoField = (textVal.infoField as unknown) as obs.ETextInfoType;
        switch (textVal.infoField) {
          case infoField === obs.ETextInfoType.Warning:
            return (
              <InputWrapper style={{ color: 'var(--info)' }}>{textVal.description}</InputWrapper>
            );
          case infoField === obs.ETextInfoType.Error:
            return (
              <InputWrapper style={{ color: 'var(--warning)' }}>{textVal.description}</InputWrapper>
            );
          default:
            return <InputWrapper>{textVal.description}</InputWrapper>;
        }
      } else {
        return <TextInput {...inputProps} isPassword={inputProps.masked} />;
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
          label: $translateIfExistWithCheck(opt.description),
          originalLabel: opt.description,
        };
      });
      return <ListInput {...inputProps} options={options} allowClear={false} />;

    case 'OBS_INPUT_RESOLUTION_LIST':
      // eslint-disable-next-line no-case-declarations
      const resolutions: Omit<
        IObsListOption<unknown>,
        'description'
      >[] = (p.value as IObsListInput<number>).options.map(opt => {
        // treat 0 as an non-selected option if the description is empty
        if (opt.value === 0 && opt.description === '') {
          return { label: $t('Select Option'), value: 0 };
        }

        return {
          value: opt.value,
          label: $translateIfExistWithCheck(opt?.description),
          originalLabel: opt?.description,
        };
      });

      return <ObsInputResolutionField inputProps={inputProps} options={resolutions} />;

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

    case 'OBS_PROPERTY_BITMASK':
      // eslint-disable-next-line no-case-declarations
      const flagsVal = p.value as IObsBitmaskInput;
      const flags = Utils.numberToBinnaryArray(flagsVal.value, flagsVal.size).reverse();

      return (
        <InputWrapper label={flagsVal.description}>
          {flags.map((flag, index) => (
            <Button
              key={`flag-${index}`}
              onClick={() => {
                const newFlags = Array(flagsVal.size).fill(0);
                newFlags.splice(index, 1, 1);
                inputProps.onChange(Utils.binnaryArrayToNumber(newFlags.reverse()));
              }}
              style={{
                marginRight: '5px',
                backgroundColor: flag === 1 ? 'var(--primary)' : 'var(--dark-background)',
                color: flag === 1 ? 'var(--action-button-text)' : 'var(--icon)',
                borderColor: flag === 1 ? 'var(--primary)' : 'var(--icon)',
                padding: '10px',
                lineHeight: 0.75,
              }}
            >
              {index}
            </Button>
          ))}
        </InputWrapper>
      );

    case 'OBS_PROPERTY_PATH':
      return <FileInput {...inputProps} directory={true} />;

    case 'OBS_PROPERTY_UINT':
      return (
        <InputWrapper style={{ marginBottom: '8px' }} nowrap={layout === 'vertical'}>
          <CheckboxInput {...inputProps} />
        </InputWrapper>
      );

    default:
      return <span style={{ color: 'red' }}>Unknown input type {type}</span>;
  }
}

interface IObsFormGroupProps {
  categoryName?: string;
  value: ISettingsSubCategory[];
  onChange: (newValue: ISettingsSubCategory[]) => unknown;
  type?: IObsFormType;
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

  const type = p.type || 'default';

  return (
    <div className="form-groups">
      {type === 'default' &&
        sections.map((sectionProps, ind) => (
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

      {type === 'tabs' && <ObsTabbedFormGroup sections={sections} onChange={onChangeHandler} />}

      {type === 'collapsible' &&
        sections.map((sectionProps, ind) => (
          <div className="section" key={`${sectionProps.nameSubCategory}${ind}`}>
            {sectionProps.nameSubCategory === 'Untitled' ? (
              <div className="section-content">
                <ObsForm
                  value={sectionProps.parameters}
                  onChange={formData => onChangeHandler(formData, ind)}
                />
              </div>
            ) : (
              <ObsCollapsibleFormItem
                key={`${sectionProps.nameSubCategory}${ind}`}
                section={sectionProps}
                onChange={formData => onChangeHandler(formData, ind)}
              />
            )}
          </div>
        ))}
    </div>
  );
}

interface IObsTabbedFormGroupProps {
  sections: ISettingsSubCategory[];
  onChange: (formData: TObsFormData, ind: number) => unknown;
}

export function ObsTabbedFormGroup(p: IObsTabbedFormGroupProps) {
  const tabs = useMemo(() => {
    // combine all audio tracks into one tab
    const filtered = p.sections
      .filter(sectionProps => sectionProps.nameSubCategory !== 'Untitled')
      .filter(sectionProps => !sectionProps.nameSubCategory.startsWith('Audio - Track'))
      .map(sectionProps => sectionProps.nameSubCategory);

    filtered.splice(2, 0, 'Audio');
    return filtered;
  }, [p.sections]);

  const [currentTab, setCurrentTab] = useState(p.sections[1].nameSubCategory);

  const [customResolution, setCustomResolution] = useState('');
  return (
    <div className="section" key="tabbed-section">
      <Form layout="vertical" style={{ marginBottom: '24px' }}>
        <TextInput
          value={customResolution}
          onChange={val => setCustomResolution(val)}
          label="testing"
          rules={[
            {
              message: $t('The resolution must be in the format [width]x[height] (i.e. 1920x1080)'),
              pattern: /^[0-9]+x[0-9]+$/,
            },
          ]}
          name="testing"
        />
      </Form>

      {p.sections.map((sectionProps, ind) => (
        <div className="section-content" key={`${sectionProps.nameSubCategory}${ind}`}>
          {sectionProps.nameSubCategory === 'Untitled' && (
            <>
              <ObsForm
                value={sectionProps.parameters}
                onChange={formData => p.onChange(formData, ind)}
              />
              <Tabs tabs={tabs} onChange={setCurrentTab} style={{ marginBottom: '24px' }} />
            </>
          )}

          {sectionProps.nameSubCategory === currentTab && (
            <ObsForm
              value={sectionProps.parameters}
              onChange={formData => p.onChange(formData, ind)}
            />
          )}

          {currentTab === 'Audio' && sectionProps.nameSubCategory.startsWith('Audio - Track') && (
            <div
              style={{
                backgroundColor: 'var(--section-wrapper)',
                padding: '15px',
                marginBottom: '30px',
                borderRadius: '5px',
              }}
            >
              <h2 className="section-title">{$t(sectionProps.nameSubCategory)}</h2>
              <ObsForm
                value={sectionProps.parameters}
                onChange={formData => p.onChange(formData, ind)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface IObsCollapsibleFormGroupProps {
  section: ISettingsSubCategory;
  onChange: (formData: TObsFormData, ind: number) => unknown;
}

const { Panel } = Collapse;

export function ObsCollapsibleFormItem(p: IObsCollapsibleFormGroupProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Collapse
      className={cx('section-content', 'section-content--collapse')}
      onChange={() => setExpanded(!expanded)}
      expandIcon={({ isActive }) => (
        <i
          className={cx('fa', 'section-title-icon', {
            'fa-minus': isActive,
            'fa-plus': !isActive,
          })}
        />
      )}
      bordered={false}
    >
      <Panel
        className="section-content--panel"
        header={p.section.nameSubCategory}
        key={`${p.section.nameSubCategory}`}
      >
        <ObsForm value={p.section.parameters} onChange={p.onChange} />
      </Panel>
    </Collapse>
  );
}

interface IObsInputResolutionFieldProps {
  inputProps: any;
  options?: Omit<IObsListOption<unknown>, 'description'>[];
}

function ObsInputResolutionField(p: IObsInputResolutionFieldProps) {
  const [custom, setCustom] = useState(false);
  const [customResolution, setCustomResolution] = useState(p.inputProps.value);

  // const form = useForm();
  const formContext = useFormContext();

  function onChange(val: string) {
    formContext?.antForm.validateFields();
    // form.validateFields();
    setCustomResolution(val);

    if (custom && /^[0-9]+x[0-9]+$/.test(customResolution)) {
      p.inputProps.onChange(customResolution);
    }
  }

  function onClick() {
    formContext?.antForm.validateFields();
    // form.validateFields();
    const isValid = /^[0-9]+x[0-9]+$/.test(customResolution);
    if (custom && !isValid) return;

    if (custom && isValid) {
      p.inputProps.onChange(customResolution);
      setCustomResolution('');
    }

    setCustom(!custom);
  }

  return (
    <>
      {custom ? (
        <TextInput
          {...p.inputProps}
          value={customResolution}
          onChange={val => onChange(val)}
          label={p.inputProps.label}
          validateTrigger="onBlur"
          rules={[
            {
              message: $t('The resolution must be in the format [width]x[height] (i.e. 1920x1080)'),
              pattern: /^[0-9]+x[0-9]+$/,
            },
          ]}
          uncontrolled={false}
          name={p.inputProps.name}
        />
      ) : (
        <ListInput
          {...p.inputProps}
          allowClear={false}
          options={p.options}
          rules={[
            {
              message: $t('The resolution must be in the format [width]x[height] (i.e. 1920x1080)'),
              pattern: /^[0-9]+x[0-9]+$/,
            },
          ]}
          placeholder={$t('Select Option')}
        />
      )}

      <Button type={custom ? 'primary' : 'default'} onClick={onClick}>
        {custom ? $t('Apply Primary') : $t('Custom')}
      </Button>
    </>
  );
}
