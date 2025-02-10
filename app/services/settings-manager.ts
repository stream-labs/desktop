import { InitAfter, Service } from 'services/core';
import { RealmObject } from './realm';
import { ObjectSchema } from 'realm';
import {
  IObsInput,
  obsValuesToInputValues,
  inputValuesToObsValues,
  TObsFormData,
  TObsType,
  TObsValue,
  IObsListOption,
  IObsListInput,
} from 'components/obs/inputs/ObsInput';
import { SettingsService, ISettingsCategory, ISettingsSubCategory } from 'services/settings';
import * as obs from '../../obs-api';
import { Inject } from '../services/core/injector';
import { SourcesService } from 'services/sources';
import { AudioService, E_AUDIO_CHANNELS } from 'services/audio';
import { byOS, getOS, OS } from 'util/operating-systems';
import { SceneCollectionsService } from 'services/scene-collections';
import { WindowsService } from 'services/windows';
import * as remote from '@electron/remote';
import { TDisplayType } from './settings-v2';
import { Partial } from 'lodash-decorators';

/**
 * TODO: Remove when we are sure that the string conversion method works
 *
 * Previously, list values were an object with both the key and the value being name of the setting property
 * To enforce data integrity, realm requires a separate object for the list values. This must be updated
 * if any new properties are added to the list values on the backend.

 * class SettingListValue extends RealmObject {
 *   streamType?: string;
 *   service?: string;
 *   server?: string;
 *   Mode?: string;
 *   StreamEncoder?: string;
 *   ABitrate?: string;
 *   RecQuality?: string;
 *   RecFormat?: string;
 *   RecAEncoder?: string;
 *   ProcessPriority?: string;
 *   ColorFormat?: string;
 *   ColorSpace?: string;
 *   ColorRange?: string;
 *   MonitoringDeviceName?: string;
 *   BindIP?: string;

 *   static schema: ObjectSchema = {
 *     name: 'SettingListValue',
 *     embedded: true,
 *     properties: {
 *       streamType: { type: 'string', optional: true, default: '' },
 *       service: { type: 'string', optional: true },
 *       server: { type: 'string', optional: true },
 *       Mode: { type: 'string', optional: true },
 *       StreamEncoder: { type: 'string', optional: true },
 *       ABitrate: { type: 'string', optional: true },
 *       RecQuality: { type: 'string', optional: true },
 *       RecFormat: { type: 'string', optional: true },
 *       RecAEncoder: { type: 'string', optional: true },
 *       ProcessPriority: { type: 'string', optional: true },
 *       ColorFormat: { type: 'string', optional: true },
 *       ColorSpace: { type: 'string', optional: true },
 *       ColorRange: { type: 'string', optional: true },
 *       MonitoringDeviceName: { type: 'string', optional: true },
 *       BindIP: { type: 'string', optional: true },
 *     },
 *   };
 * }

 * SettingListValue.register({ persist: true });
 *
 */

type TSettingsProfile = 'General' | 'Stream' | 'StreamSecond' | 'Output' | 'Advanced';

class SettingListOption extends RealmObject implements IObsListOption<TObsValue> {
  description: string;
  value: TObsValue | null;

  static schema: ObjectSchema = {
    name: 'SettingListOption',
    embedded: true,
    properties: {
      description: { type: 'string', default: '' },
      value: { type: 'mixed', default: null },
    },
  };

  get option() {
    return this.toObject(true);
  }
}

SettingListOption.register({ persist: true });

class SettingInputData extends RealmObject implements IObsInput<TObsValue> {
  value: TObsValue | null;
  currentValue?: TObsValue | null;
  name: string;
  description: string;
  showDescription?: boolean;
  type: TObsType & 'OBS_PROPERTY_NULL';
  subType?: string;
  enabled?: boolean;
  visible?: boolean;
  masked?: boolean;
  minVal?: number;
  maxVal?: number;
  stepVal?: number;
  options?: SettingListOption[];
  values?: string;

  static schema: ObjectSchema = {
    name: 'SettingInputData',
    embedded: true,
    properties: {
      value: { type: 'mixed', default: null },
      currentValue: { type: 'mixed', optional: true },
      name: { type: 'string', default: '' },
      description: { type: 'string', default: '' },
      showDescription: { type: 'bool', optional: true },
      type: { type: 'string', default: 'OBS_PROPERTY_NULL' },
      subType: { type: 'string', optional: true },
      enabled: { type: 'bool', optional: true },
      visible: { type: 'bool', optional: true },
      masked: { type: 'bool', optional: true },
      minVal: { type: 'double', optional: true },
      maxVal: { type: 'double', optional: true },
      stepVal: { type: 'double', optional: true },
      options: {
        type: 'list',
        objectType: 'SettingListOption',
        default: [] as SettingListOption[],
      },
      values: {
        type: 'string',
        optional: true,
      },
    },
  };
}

SettingInputData.register({ persist: true });
class SettingsSubCategory extends RealmObject implements ISettingsSubCategory {
  nameSubCategory: string;
  codeSubCategory?: string;
  parameters: SettingInputData[];

  static schema: ObjectSchema = {
    name: 'SettingsSubCategory',
    embedded: true,
    properties: {
      nameSubCategory: { type: 'string', default: '' },
      codeSubCategory: { type: 'string', optional: true },
      parameters: {
        type: 'list',
        objectType: 'SettingInputData',
        default: [] as SettingInputData[],
      },
    },
  };

  get values() {
    return this.toObject(true);
  }
}

SettingsSubCategory.register({ persist: true });

class SettingsCategory extends RealmObject implements ISettingsCategory {
  type: number;
  formData: SettingsSubCategory[];

  static schema: ObjectSchema = {
    name: 'SettingsCategory',
    embedded: true,
    properties: {
      type: { type: 'int', default: 0 },
      formData: {
        type: 'list',
        objectType: 'SettingsSubCategory',
        default: [] as SettingsSubCategory[],
      },
    },
  };
}

SettingsCategory.register({ persist: true });
export class SettingsProfile extends RealmObject {
  General: SettingsCategory;
  Stream: SettingsCategory;
  StreamSecond: SettingsCategory;
  Output: SettingsCategory;
  // Video: <== from video settings service
  // Audio: <== from settings service;
  Advanced: SettingsCategory;

  static schema: ObjectSchema = {
    name: 'SettingsProfile',
    properties: {
      General: {
        type: 'object',
        objectType: 'SettingsCategory',
        default: {} as SettingsCategory,
      },
      Stream: { type: 'object', objectType: 'SettingsCategory', default: {} as SettingsCategory },
      StreamSecond: {
        type: 'object',
        objectType: 'SettingsCategory',
        default: {} as SettingsCategory,
      },
      Output: { type: 'object', objectType: 'SettingsCategory', default: {} as SettingsCategory },
      // Video: { type: 'object', objectType: 'SettingsCategory', default: {} as SettingsCategory },
      // Audio: <== from audio settings service
      Advanced: {
        type: 'object',
        objectType: 'SettingsCategory',
        default: {} as SettingsCategory,
      },
    },
  };

  get categories() {
    return Object.keys(this.values);
  }

  get values() {
    const categories = {} as any;
    const cats = this.toObject(true) as any;

    for (const category in cats) {
      const formData = Array.from(cats[category].formData) as SettingsSubCategory[];

      const data = [];

      for (const subCategory of formData) {
        const params = [];
        const subCat = subCategory;

        const parameters = Array.from(subCategory.parameters);
        for (const parameter of parameters) {
          const param = {
            currentValue: parameter?.currentValue,
            value: parameter.value,
            name: parameter.name,
            type: parameter.type,
            description: parameter.description,
            showDescription: parameter?.showDescription,
            subType: parameter?.subType,
            enabled: parameter?.enabled,
            visible: parameter?.visible,
            masked: parameter?.masked,
            minVal: parameter?.minVal,
            maxVal: parameter?.maxVal,
            stepVal: parameter?.stepVal,
          } as any;

          if (parameter?.options.length) {
            const options = Array.from(parameter.options);
            const inputOptions = [];

            for (const option of options) {
              inputOptions.push({
                description: option.description,
                value: option.value,
              });
            }

            param.options = inputOptions;
          }

          if (parameter?.values) {
            param.values = JSON.parse(parameter.values);
          }

          params.push(param);
        }

        data.push({
          nameSubCategory: subCat.nameSubCategory,
          codeSubCategory: subCat.codeSubCategory,
          parameters: params,
        });
      }
      categories[category] = { ...cats[category], formData: data };
    }
    return categories;
  }
}

SettingsProfile.register({ persist: true });

export class SettingsManagerState extends RealmObject {
  horizontal: SettingsProfile;
  vertical: SettingsProfile;

  static schema: ObjectSchema = {
    name: 'SettingsManagerState',
    properties: {
      horizontal: {
        type: 'object',
        objectType: 'SettingsProfile',
        default: {},
      },
      vertical: {
        type: 'object',
        objectType: 'SettingsProfile',
        default: {},
      },
    },
  };

  get categories() {
    return Object.keys(this.horizontal.categories);
  }

  get displays() {
    return this.toObject(true);
  }

  get default() {
    return this.horizontal;
  }

  protected onCreated(): void {
    const settingsFormData = this.formatObsSettings();

    this.db.write(() => {
      for (const display in this.displays) {
        this.deepPatch(Object.assign(this, { [display]: { ...settingsFormData } }));
      }
    });
  }

  debugValues() {
    console.log('Root Settings', this.toObject(true));

    // const cats = this.toObject(true) as any;

    // for (const category in cats) {
    //   const formData = Array.from(cats[category].formData);

    //   formData.forEach((subCategory: SettingsSubCategory) => {
    //     console.log('array from subCategory', subCategory);
    //   });
    //   const vals = [...formData.values()];
    //   vals.forEach((subCategory: SettingsSubCategory) => {
    //     console.log('subCategory', subCategory);
    //   });
    // }
  }

  formatObsSettings() {
    const settingsFormData = {} as any;

    this.categories.forEach((categoryName: keyof SettingsProfile) => {
      const settingsValues = this.fetchSettingsFromObs(categoryName);
      settingsFormData[categoryName] = settingsValues;
    });

    return settingsFormData;
  }

  fetchSettingsFromObs(categoryName: string): ISettingsCategory {
    const settingsMetadata = obs.NodeObs.OBS_settings_getSettings(categoryName);

    let settings = settingsMetadata.data;

    // console.log('settings', settings);
    if (!settings) settings = [];

    // Names of settings that are disabled because we
    // have not implemented them yet.
    const DENY_LIST_NAMES = [
      'SysTrayMinimizeToTray',
      'SysTrayEnabled',
      'CenterSnapping',
      'HideProjectorCursor',
      'ProjectorAlwaysOnTop',
      'SaveProjectors',
      'SysTrayWhenStarted',
    ];

    for (const group of settings) {
      group.parameters = obsValuesToInputValues(group.parameters, {
        disabledFields: DENY_LIST_NAMES,
        transformListOptions: true,
      });
    }

    settings = settings.map((subCategory: ISettingsSubCategory) => {
      const parameters = subCategory.parameters.map((parameter: any) => {
        // map data to expected props for data validation
        const validatedParameter = {
          name: parameter.name,
          value: parameter.value,
          type: parameter.type,
          currentValue: parameter?.currentValue,
          description: parameter.description,
          showDescription: parameter?.showDescription,
          subType: parameter?.subType,
          enabled: parameter?.enabled,
          visible: parameter?.visible,
          masked: parameter?.masked,
          options: parameter?.options,
        } as any;

        if (parameter?.values.length) {
          validatedParameter.values = JSON.stringify(parameter.values);
          console.log('validatedParameter.values', validatedParameter.values);
        }

        return validatedParameter;
      });

      return {
        ...subCategory,
        parameters,
      };
    });

    return {
      type: settingsMetadata.type,
      formData: settings,
    };
  }

  get values() {
    return {
      horizontal: this.horizontal.values,
      vertical: this.vertical.values,
    };
  }
}

SettingsManagerState.register({ persist: true });

@InitAfter('SettingsService')
export class SettingsManagerService extends Service {
  @Inject() private settingsService: SettingsService;
  state = SettingsManagerState.inject();

  init() {
    this.settingsService.settingsUpdated.subscribe((settingsPatch: Partial<SettingsProfile>) => {
      const [categoryName, updatedSettings] = Object.entries(settingsPatch)[0];

      // TODO: WORKING HERE ON CREATING PATCH FOR SETTINGS
      const currentSettings = this.state.horizontal.values[categoryName];
      console.log('currentSettings', currentSettings);
      const settingsToUpdate = updatedSettings.map(
        (subCategory: SettingsSubCategory) => subCategory.nameSubCategory,
      );
      const formData = currentSettings.formData.map((subCategory: SettingsSubCategory) => {
        if (settingsToUpdate.includes(subCategory.nameSubCategory)) {
          const updatedSubCategory = updatedSettings.find(
            (sub: SettingsSubCategory) => sub.nameSubCategory === subCategory.nameSubCategory,
          );
          return updatedSubCategory;
        }

        return subCategory;
      });

      console.log('formData', formData);

      const patch = {
        ...this.state.values.horizontal,
        [categoryName]: { ...currentSettings, formData },
      };
      console.log('patch', patch);

      // this.setSettings(patch, 'horizontal');
      // this.setSettings(patch, 'vertical');
    });
  }

  logRealmValues() {
    const settings = this.state.values;
    console.log('settings obj', settings);
  }

  /**
   * Set settings in the settings manager realm
   * @param categoryName - name of property
   * @param settingsData - data to set
   */
  setSettings(patch: Partial<SettingsProfile>, display: TDisplayType) {
    console.log(patch);

    this.state.db.write(() => {
      this.state.deepPatch(Object.assign(this.state, { [display]: { ...patch } }));
    });
  }
}
