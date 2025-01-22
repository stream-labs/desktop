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

    const cats = this.toObject(true) as any;

    for (const category in cats) {
      const formData = Array.from(cats[category].formData);

      formData.forEach((subCategory: SettingsSubCategory) => {
        // console.log('array from subCategory', subCategory);
      });

      // TRY WITH SPREAD OPERATOR
      const vals = [...formData.values()];
      vals.forEach((subCategory: SettingsSubCategory) => {
        console.log('spread subCategory', subCategory);
      });
    }
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
  @Inject() private sourcesService: SourcesService;
  @Inject() private audioService: AudioService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private settingsService: SettingsService;
  @Inject() private windowsService: WindowsService;

  state = SettingsManagerState.inject();

  init() {
    // this.loadSettingsIntoStore();
    this.ensureValidEncoder('horizontal');
    this.ensureValidEncoder('vertical');

    this.sceneCollectionsService.collectionSwitched.subscribe(() =>
      this.settingsService.refreshAudioSettings(),
    );
  }

  /**
   * Load latest settings from obs into the realms
   */
  loadSettingsIntoStore() {
    // load configuration from nodeObs to state
    Object.keys(this.state.displays).forEach((display: TDisplayType) => {
      this.state.categories.forEach((categoryName: TSettingsProfile) => {
        const settings = this.state.fetchSettingsFromObs(categoryName);
        this.setSettings({ [categoryName]: settings }, display);
      });
    });
  }

  formatObsSettings() {
    const settings = this.state.values;
    console.log('settings obj', settings);
  }

  /**
   * Update the input options and values
   * @remark Primarily used when loading a settings form
   */
  updateObsSettingsOptions() {
    //
    this.state.categories.forEach((categoryName: keyof SettingsProfile) => {
      this.state.fetchSettingsFromObs(categoryName).formData.forEach(subCategory => {
        subCategory.parameters.forEach((parameter: any) => {
          const optionsAndValues = {};
          const options = parameter?.options;
          const values = parameter.values;

          if (parameter?.options.length || parameter?.values.length) {
            const updatedOptions = options.map((option: any) => ({
              description: option.description,
              value: option.value,
            }));

            // const formData = this.state.values[categoryName].formData;

            // const patch = { [categoryName]: { ...formData, [subCategory] } }

            // this.state.db.write(() => {
            //   this.state.deepPatch(patch);
            // });

            // this.updateSettingsOptions(categoryName, subCategory.nameSubCategory, parameter.name, {
            //   options: updatedOptions,
            //   values: JSON.stringify(parameter.values),
            // });
          }
        });
      });
    });
  }

  /**
   * Ensure that the output encoder is valid
   * @remark Copied from the settings service because it needs to reference the settings profile realm
   */
  private ensureValidEncoder(display: TDisplayType) {
    if (getOS() === OS.Mac) return;

    const encoderSetting: IObsListInput<string> =
      this.settingsService.findSetting(
        this.state[display].Output.formData,
        'Streaming',
        'Encoder',
      ) ??
      this.settingsService.findSetting(
        this.state[display].Output.formData,
        'Streaming',
        'StreamEncoder',
      );
    const encoderIsValid = !!encoderSetting.options.find(opt => opt.value === encoderSetting.value);

    // The backend incorrectly defaults to obs_x264 in Simple mode rather x264.
    // In this case we shouldn't do anything here.
    if (encoderSetting.value === 'obs_x264') return;

    if (!encoderIsValid) {
      const mode: string = this.settingsService.findSettingValue(
        this.state[display].Output.formData,
        'Untitled',
        'Mode',
      );

      if (mode === 'Advanced') {
        this.setSettingValue('Output', 'Encoder', 'obs_x264', display);
      } else {
        this.setSettingValue('Output', 'StreamEncoder', 'x264', display);
      }

      remote.dialog.showMessageBox(this.windowsService.windows.main, {
        type: 'error',
        message:
          'Your stream encoder has been reset to Software (x264). This can be caused by out of date graphics drivers. Please update your graphics drivers to continue using hardware encoding.',
      });
    }
  }

  /**
   * Set an individual setting value
   */
  setSettingValue(category: string, name: string, value: TObsValue, display: TDisplayType) {
    const formData = this.settingsService.patchSetting(
      this.state.fetchSettingsFromObs(category).formData,
      name,
      {
        value,
      },
    );
    this.setSettings(category, formData, display);
  }

  updateSettingsOptions(
    category: keyof SettingsProfile,
    subCategory: string,
    parameter: string,
    patch: any,
    display: TDisplayType,
  ) {
    const settings = this.state[display].values;
    const updatedSettings = settings[category].formData.map((subCat: ISettingsSubCategory) => {
      if (subCat.nameSubCategory === subCategory) {
        const updatedParameters = subCat.parameters.map((param: any) => {
          if (param.name === parameter) {
            const options = param.options.map((option: any) => ({
              description: option.description,
              value: option.value,
            }));

            return {
              ...param,
              options,
            };
          }

          return param;
        });

        return {
          ...subCat,
          parameters: updatedParameters,
        };
      }

      return subCat;
    });

    this.state.db.write(() => {
      this.state.deepPatch({ [category]: { formData: updatedSettings } });
    });
  }

  /**
   * Set settings in obs.
   * @remark When setting video settings, use the v2 video settings service.
   * @remark The forceApplyCategory parameter is currently only used for refreshing
   * video settings before starting recording. This is because the video settings is using the v2 api
   * and the output settings are currently using the v1 api. This will no longer be needed when
   * output settings are migrated to the new api.
   *
   * This parameter exists because we need to guarantee that the latest video and output settings
   * are in the store when recording. Currently, the only time that a value is passed in is in the
   * refreshVideoSettings function that is called right before starting recording. We need to force
   * the store to load the video setting but only in this instance.
   * @param categoryName - name of property
   * @param settingsData - data to set
   * @param forceApplyCategory - name of property to force apply settings.
   */
  parseSettings(
    categoryName: string,
    settingsData: ISettingsSubCategory[],
    forceApplyCategory?: string,
  ) {
    if (categoryName === 'Audio') this.setAudioSettings([settingsData.pop()]);
    if (categoryName === 'Video' && forceApplyCategory && forceApplyCategory !== 'Video') return;

    const dataToSave = [];

    for (const subGroup of settingsData) {
      dataToSave.push({
        ...subGroup,
        parameters: inputValuesToObsValues(subGroup.parameters, {
          valueToCurrentValue: true,
        }),
      });

      if (
        categoryName === 'Output' &&
        subGroup.nameSubCategory === 'Untitled' &&
        subGroup.parameters[0].value === 'Simple'
      ) {
        this.audioService.setSimpleTracks();
      }
    }

    obs.NodeObs.OBS_settings_saveSettings(categoryName, dataToSave);

    // create patch
    // this.setSettings({ categoryName: { formData: dataToSave } });
  }

  setSettings(
    categoryName: keyof SettingsProfile,
    settingsPatch: DeepPartial<SettingsCategory>, // ISettingsSubCategory
    display: TDisplayType,
  ) {
    if (categoryName === 'Audio') this.setAudioSettings([settingsData.pop()]);
    if (categoryName === 'Video' && forceApplyCategory && forceApplyCategory !== 'Video') return;

    const dataToSave = [];

    for (const subGroup of settingsData) {
      dataToSave.push({
        ...subGroup,
        parameters: inputValuesToObsValues(subGroup.parameters, {
          valueToCurrentValue: true,
        }),
      });

      if (
        categoryName === 'Output' &&
        subGroup.nameSubCategory === 'Untitled' &&
        subGroup.parameters[0].value === 'Simple'
      ) {
        this.audioService.setSimpleTracks();
      }
    }

    const newSettings = { [categoryName]: settingsPatch };

    this.state.db.write(() => {
      this.state.deepPatch({ [display]: settingsPatch });
    });

    obs.NodeObs.OBS_settings_saveSettings(categoryName, newSettings);
  }

  private setAudioSettings(settingsData: ISettingsSubCategory[]) {
    const audioDevices = this.audioService.devices;

    settingsData[0].parameters.forEach((deviceForm, ind) => {
      const channel = ind + 1;
      const isOutput = [E_AUDIO_CHANNELS.OUTPUT_1, E_AUDIO_CHANNELS.OUTPUT_2].includes(channel);
      const device = audioDevices.find(device => device.id === deviceForm.value);
      let source = this.sourcesService.views
        .getSources()
        .find(source => source.channel === channel);

      if (source && deviceForm.value === null) {
        this.sourcesService.removeSource(source.sourceId);
        return;
      } else if (device && deviceForm.value !== null) {
        const displayName = device.id === 'default' ? deviceForm.name : device.description;

        if (!source) {
          source = this.sourcesService.createSource(
            displayName,
            byOS({
              [OS.Windows]: isOutput ? 'wasapi_output_capture' : 'wasapi_input_capture',
              [OS.Mac]: isOutput ? 'coreaudio_output_capture' : 'coreaudio_input_capture',
            }),
            { device_id: deviceForm.value },
            { channel },
          );
        } else {
          source.updateSettings({ device_id: deviceForm.value });
        }

        source.setName(displayName);
      }
    });
  }
}
