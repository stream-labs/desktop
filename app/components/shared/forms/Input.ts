import _ from 'lodash';
import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import * as obs from '../../../../obs-api';
import {
  isListProperty,
  isEditableListProperty,
  isNumberProperty,
  isTextProperty,
  isFontProperty,
  isPathProperty
} from '../../../util/properties-type-guards';
import { $t } from 'services/i18n';

/**
 * all possible OBS properties types
 */
export declare type TObsType =
  'OBS_PROPERTY_BOOL' |
  'OBS_PROPERTY_INT' |
  'OBS_PROPERTY_LIST' |
  'OBS_PROPERTY_PATH' |
  'OBS_PROPERTY_FILE' |
  'OBS_PROPERTY_EDIT_TEXT' |
  'OBS_PROPERTY_TEXT' |
  'OBS_PROPERTY_UINT' |
  'OBS_PROPERTY_COLOR' |
  'OBS_PROPERTY_DOUBLE' |
  'OBS_PROPERTY_FLOAT' |
  'OBS_PROPERTY_SLIDER' |
  'OBS_PROPERTY_FONT' |
  'OBS_PROPERTY_EDITABLE_LIST' |
  'OBS_PROPERTY_BUTTON' |
  'OBS_PROPERTY_BITMASK' |
  'OBS_INPUT_RESOLUTION_LIST';

/**
 * OBS values that frontend application can change
 */
export declare type TObsValue = number | string | boolean | IFont | TObsStringList;

/**
 * common interface for OBS objects properties
 */
export interface IFormInput<TValueType> {
  value: TValueType;
  name: string;
  description: string;
  showDescription?: boolean;
  enabled?: boolean;
  visible?: boolean;
  masked?: boolean;
  type?: TObsType;
}

export declare type TFormData = (IFormInput<TObsValue> | IListInput<TObsValue>)[];

export interface IListInput<TValue> extends IFormInput<TValue> {
  options: IListOption<TValue>[];
}

export interface IListOption<TValue> {
  description: string;
  value: TValue;
}

export interface IPathInputValue extends IFormInput<string> {
  filters: IElectronOpenDialogFilter[];
}

export interface INumberInputValue extends IFormInput<number> {
  minVal: number;
  maxVal: number;
  stepVal: number;
}

export interface ISliderInputValue extends INumberInputValue {
  usePercentages?: boolean;
}

export interface ITextInputValue extends IFormInput<string> {
  multiline: boolean;
}

export interface IBitmaskInput extends IFormInput<number> {
  size: number;
}

export interface IFont {
  face?: string;
  flags?: number;
  size?: number;
  path?: string;
}

export interface IGoogleFont {
  face: string;
  flags: number;
  path?: string;
  size?: string;
}

export type TObsStringList = { value: string }[];

export interface IEditableListInputValue extends IFormInput<TObsStringList> {
  defaultPath?: string;
  filters?: IElectronOpenDialogFilter[];
}

export interface IElectronOpenDialogFilter {
  name: string;
  extensions: string[];
}

function parsePathFilters(filterStr: string): IElectronOpenDialogFilter[] {
  const filters = _.compact(filterStr.split(';;'));

  // Browser source uses *.*
  if (filterStr === '*.*') {
    return [
      {
        name: 'All Files',
        extensions: ['*']
      }
    ];
  }

  return filters.map(filter => {
    const match = filter.match(/^(.*)\((.*)\)$/);
    const desc = _.trim(match[1]);
    let types = match[2].split(' ');

    types = types.map(type => {
      return type.match(/^\*\.(.+)$/)[1];
    });

    // This is the format that electron file dialogs use
    return {
      name: desc,
      extensions: types
    };
  });
}

/**
 * each option represent one known nodeObs issue
 */
interface IObsFetchOptions {
  disabledFields?: string[];
  valueIsObject?: boolean;
  boolIsString?: boolean;
  transformListOptions?: boolean;
  subParametersGetter?: (propName: string) => Dictionary<any>[];
  valueGetter?: (propName: string) => any;
}

export function obsValuesToInputValues(
  obsProps: Dictionary<any>[],
  options: IObsFetchOptions = {}
): TFormData {

  const resultProps: TFormData = [];

  for (const obsProp of obsProps) {
    let prop = { ...obsProp } as IFormInput<TObsValue>;
    let valueObject: Dictionary<any>;
    let obsValue = obsProp.currentValue;

    if (options.valueGetter) {
      valueObject = options.valueGetter(obsProp.name);
      obsValue = valueObject;
    }

    if (options.valueIsObject) {
      obsValue = obsValue.value;
    }

    prop.description = $t(prop.description);
    prop.value = obsValue;
    prop.masked = !!obsProp.masked;
    prop.enabled = !!obsProp.enabled;
    prop.visible = !!obsProp.visible;

    if (options.disabledFields && options.disabledFields.includes(prop.name)) {
      prop.visible = false;
    }

    if (['OBS_PROPERTY_LIST', 'OBS_INPUT_RESOLUTION_LIST'].includes(obsProp.type)) {
      const listOptions: any[] = [];

      if (options.transformListOptions) for (const listOption of (obsProp.values || []))  {
        listOptions.push({
          value: listOption[Object.keys(listOption)[0]],
          description: $t(Object.keys(listOption)[0])
        });
      }

      if (options.subParametersGetter) {
        listOptions.push(...options.subParametersGetter(prop.name));
      }

      for (const listOption of listOptions) {
        if (listOption.description === void 0) listOption.description = listOption['name'];
      }

      const needToSetDefaultValue = listOptions.length && prop.value === void 0;
      if (needToSetDefaultValue) prop.value = listOptions[0].value;

      (<any>prop).options = listOptions;

    } else if (obsProp.type === 'OBS_PROPERTY_BOOL') {

      prop.value = !!prop.value;

    } else if (['OBS_PROPERTY_INT', 'OBS_PROPERTY_FLOAT', 'OBS_PROPERTY_DOUBLE'].includes(obsProp.type)) {
      prop = {
        ...prop,
        value: Number(prop.value),
        minVal: obsProp.minVal,
        maxVal: obsProp.maxVal,
        stepVal: obsProp.stepVal
      } as INumberInputValue;

      if (obsProp.subType === 'OBS_NUMBER_SLIDER') {
        prop.type = 'OBS_PROPERTY_SLIDER';
      }
    } else if (obsProp.type === 'OBS_PROPERTY_PATH') {

      if (valueObject && valueObject.type === 'OBS_PATH_FILE') {
        prop = {
          ...prop,
          type: 'OBS_PROPERTY_FILE',
          filters: parsePathFilters(valueObject.filter)
        } as IPathInputValue;
      }
    } else if (obsProp.type === 'OBS_PROPERTY_FONT') {
      prop.value = valueObject;
    } else if (obsProp.type === 'OBS_PROPERTY_EDITABLE_LIST') {
      prop = {
        ...prop,
        value: valueObject,
        filters: parsePathFilters(valueObject.filter),
        defaultPath: valueObject.default_path
      } as IEditableListInputValue;
    }

    resultProps.push(prop);
  }

  return resultProps;
}

/**
 * each option represent one known nodeObs issue
 */
interface IObsSaveOptions {
  boolToString?: boolean;
  intToString?: boolean;
  valueToObject?: boolean;
  valueToCurrentValue?: boolean;
}

export function inputValuesToObsValues(
  props: TFormData,
  options: IObsSaveOptions = {}
): Dictionary<any>[] {
  const obsProps: Dictionary<any>[] = [];

  for (const prop of props) {
    const obsProp = { ...prop } as Dictionary<any>;
    obsProps.push(obsProp);

    if (prop.type === 'OBS_PROPERTY_BOOL') {
      if (options.boolToString) obsProp.currentValue = obsProp.currentValue ? 'true' : 'false';
    } else if (prop.type === 'OBS_PROPERTY_INT') {
      if (options.intToString) obsProp.currentValue = String(obsProp.currentValue);
    }

    if (
      options.valueToObject &&
      !['OBS_PROPERTY_FONT', 'OBS_PROPERTY_EDITABLE_LIST', 'OBS_PROPERTY_BUTTON'].includes(prop.type)
    ) {
      obsProp.value = { value: obsProp.value };
    }

    if (options.valueToCurrentValue) {
      obsProp.currentValue = obsProp.value;
    }
  }
  return obsProps;
}


export function getPropertiesFormData(obsSource: obs.ISource): TFormData {

  setupSourceDefaults(obsSource);

  const formData: TFormData = [];
  const obsProps = obsSource.properties;
  const obsSettings = obsSource.settings;

  if (!obsProps) return null;

  let obsProp = obsProps.first();
  do {
    let obsType: TObsType;

    switch (obsProp.type) {
      case obs.EPropertyType.Boolean:
        obsType = 'OBS_PROPERTY_BOOL'; break;
      case obs.EPropertyType.Int:
        obsType = 'OBS_PROPERTY_INT'; break;
      case obs.EPropertyType.Float:
        obsType = 'OBS_PROPERTY_FLOAT'; break;
      case obs.EPropertyType.List:
        obsType = 'OBS_PROPERTY_LIST'; break;
      case obs.EPropertyType.Text:
        obsType = 'OBS_PROPERTY_TEXT'; break;
      case obs.EPropertyType.Color:
        obsType = 'OBS_PROPERTY_COLOR'; break;
      case obs.EPropertyType.Font:
        obsType = 'OBS_PROPERTY_FONT'; break;
      case obs.EPropertyType.EditableList:
        obsType = 'OBS_PROPERTY_EDITABLE_LIST'; break;
      case obs.EPropertyType.Button:
        obsType = 'OBS_PROPERTY_BUTTON'; break;
      case obs.EPropertyType.Path:
        switch ((obsProp as obs.IPathProperty).details.type) {
          case obs.EPathType.File: obsType = 'OBS_PROPERTY_FILE'; break;
          case obs.EPathType.Directory: obsType = 'OBS_PROPERTY_PATH'; break;
        }
        break;
    }

    const formItem: IFormInput<TObsValue> = {
      value: obsSettings[obsProp.name],
      name: obsProp.name,
      description: obsProp.description,
      enabled: obsProp.enabled,
      visible: obsProp.visible,
      type: obsType
    };

    // handle property details

    if (isListProperty(obsProp)) {
      const options: IListOption<any>[] = obsProp.details.items.map(option => {
        return { value: option.value, description: option.name };
      });
      (formItem as IListInput<TObsValue>).options = options;
    }

    if (isNumberProperty(obsProp)) {
      Object.assign(formItem as INumberInputValue, {
        minVal: obsProp.details.min,
        maxVal: obsProp.details.max,
        stepVal: obsProp.details.step
      });

      if (obsProp.details.type === obs.ENumberType.Slider) {
        formItem.type = 'OBS_PROPERTY_SLIDER';
      }
    }

    if (isEditableListProperty(obsProp)) {
      Object.assign(formItem as IEditableListInputValue, {
        filters: parsePathFilters(obsProp.details.filter),
        defaultPath: obsProp.details.defaultPath
      });
    }

    if (isPathProperty(obsProp)) {
      Object.assign(formItem as IPathInputValue, {
        filters: parsePathFilters(obsProp.details.filter),
        defaultPath: obsProp.details.defaultPath
      });
    }

    if (isTextProperty(obsProp)) {
      Object.assign(formItem as ITextInputValue, {
        multiline: obsProp.details.type === obs.ETextType.Multiline
      });
    }

    if (isFontProperty(obsProp)) {
      (formItem as IFormInput<IFont>).value.path = obsSource.settings['custom_font'];
    }

    formData.push(formItem);
  } while (obsProp = obsProp.next());

  return formData;
}


export function setPropertiesFormData(obsSource: obs.ISource, form: TFormData) {
  const buttons: IFormInput<boolean>[] = [];
  const formInputs: IFormInput<TObsValue>[] = [];
  const properties = obsSource.properties;

  form.forEach(item => {
    if (item.type === 'OBS_PROPERTY_BUTTON') {
      buttons.push(item as IFormInput<boolean>);
    } else {
      formInputs.push(item);
    }
  });

  const settings: Dictionary<any> = {};
  formInputs.forEach(property => {
    settings[property.name] = property.value;

    if (property.type === 'OBS_PROPERTY_FONT') {
      settings['custom_font'] = (property.value as IFont).path;
      delete settings[property.name]['path'];
    }
  });

  obsSource.update(settings);

  buttons.forEach(buttonInput => {
    if (!buttonInput.value) return;
    const obsButtonProp = properties.get(buttonInput.name) as obs.IButtonProperty;
    obsButtonProp.buttonClicked(obsSource);
  });
}


export function setupSourceDefaults(obsSource: obs.ISource) {
  const propSettings = obsSource.settings;
  const defaultSettings = {};
  const properties = obsSource.properties;

  if (!properties) return;

  let obsProp = properties.first();
  do {
    if (
      propSettings[obsProp.name] !== void 0 ||
      !isListProperty(obsProp) ||
      obsProp.details.items.length === 0
    ) continue;
    defaultSettings[obsProp.name] = obsProp.details.items[0].value;
  } while (obsProp = obsProp.next());
  const needUpdate = Object.keys(defaultSettings).length > 0;
  if (needUpdate) obsSource.update(defaultSettings);
}


export abstract class Input<TValueType> extends Vue {

  @Prop()
  value: TValueType;

  emitInput(eventData: TValueType) {
    this.$emit('input', eventData);
  }

}
