import cloneDeep from 'lodash/cloneDeep';
import { StatefulService, mutation, ViewHandler } from 'services/core/stateful-service';
import {
  inputValuesToObsValues,
  obsValuesToInputValues,
  TObsFormData,
  IObsListInput,
  IObsInput,
  TObsValue,
} from 'components/obs/inputs/ObsInput';
import * as obs from '../../../obs-api';
import { SourcesService } from 'services/sources';
import { Inject } from '../core/injector';
import { AudioService, E_AUDIO_CHANNELS } from 'services/audio';
import { WindowsService } from 'services/windows';
import Utils from '../utils';
import { AppService } from 'services/app';
import { $t } from 'services/i18n';
import { encoderFieldsMap, obsEncoderToEncoderFamily } from './output';
import { VideoEncodingOptimizationService } from 'services/video-encoding-optimizations';
import { PlatformAppsService } from 'services/platform-apps';
import { EDeviceType, HardwareService } from 'services/hardware';
import { StreamingService } from 'services/streaming';
import { byOS, OS } from 'util/operating-systems';
import path from 'path';
import fs from 'fs';
import { UsageStatisticsService } from 'services/usage-statistics';
import { SceneCollectionsService } from 'services/scene-collections';
import electron from 'electron';

export interface ISettingsValues {
  General: {
    KeepRecordingWhenStreamStops: boolean;
    RecordWhenStreaming: boolean;
    WarnBeforeStartingStream: boolean;
    WarnBeforeStoppingStream: boolean;
    SnappingEnabled: boolean;
    SnapDistance: number;
    ScreenSnapping: boolean;
    SourceSnapping: boolean;
    CenterSnapping: boolean;
    ReplayBufferWhileStreaming: boolean;
    KeepReplayBufferStreamStops: boolean;
  };
  Stream: {
    key: string;
    streamType: string;
    service: string;
    server: string;
  };
  Output: {
    RecRB?: boolean;
    RecRBTime?: number;
    RecFormat: string;
  };
  Video: {
    Base: string;
  };
  Audio: Dictionary<TObsValue>;
  Advanced: {
    DelayEnable: boolean;
    DelaySec: number;
    fileCaching: boolean;
  };
}

export interface ISettingsSubCategory {
  nameSubCategory: string;
  codeSubCategory?: string;
  parameters: TObsFormData;
}

declare type TSettingsFormData = Dictionary<ISettingsSubCategory[]>;

export enum ESettingsCategoryType {
  Untabbed = 0,
  Tabbed = 1,
}

interface ISettingsCategory {
  type: ESettingsCategoryType;
  formData: ISettingsSubCategory[];
}

interface ISettingsServiceState {
  [categoryName: string]: ISettingsCategory;
}

class SettingsViews extends ViewHandler<ISettingsServiceState> {
  get values() {
    const settingsValues: Partial<ISettingsValues> = {};

    for (const groupName in this.state) {
      this.state[groupName].formData.forEach(subGroup => {
        subGroup.parameters.forEach(parameter => {
          settingsValues[groupName] = settingsValues[groupName] || {};
          settingsValues[groupName][parameter.name] = parameter.value;
        });
      });
    }

    return settingsValues as ISettingsValues;
  }
}

export class SettingsService extends StatefulService<ISettingsServiceState> {
  static initialState = {};

  @Inject() private sourcesService: SourcesService;
  @Inject() private audioService: AudioService;
  @Inject() private windowsService: WindowsService;
  @Inject() private appService: AppService;
  @Inject() private platformAppsService: PlatformAppsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private usageStatisticsService: UsageStatisticsService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private hardwareService: HardwareService;

  @Inject()
  private videoEncodingOptimizationService: VideoEncodingOptimizationService;

  get views() {
    return new SettingsViews(this.state);
  }

  init() {
    this.loadSettingsIntoStore();
    this.ensureValidEncoder();
    this.sceneCollectionsService.collectionSwitched.subscribe(() => this.refreshAudioSettings());
  }

  private fetchSettingsFromObs(categoryName: string): ISettingsCategory {
    const settingsMetadata = obs.NodeObs.OBS_settings_getSettings(categoryName);
    let settings = settingsMetadata.data;
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

    if (categoryName === 'Audio') {
      return {
        type: ESettingsCategoryType.Untabbed,
        formData: this.getAudioSettingsFormData(settings[0]),
      };
    }

    // We hide the encoder preset and settings if the optimized ones are in used
    if (
      categoryName === 'Output' &&
      !this.streamingService.isIdle &&
      this.videoEncodingOptimizationService.state.useOptimizedProfile
    ) {
      const encoder = obsEncoderToEncoderFamily(
        this.findSettingValue(settings, 'Streaming', 'Encoder') ||
          this.findSettingValue(settings, 'Streaming', 'StreamEncoder'),
      );
      // Setting preset visibility
      settings = this.patchSetting(settings, encoderFieldsMap[encoder].preset, { visible: false });
      // Setting encoder settings visibility
      if (encoder === 'x264') {
        settings = this.patchSetting(settings, encoderFieldsMap[encoder].encoderOptions, {
          visible: false,
        });
      }
    }

    return {
      type: settingsMetadata.type,
      formData: settings,
    };
  }

  /**
   * Can be called externally to ensure that you have the absolute latest settings
   * fetched from OBS directly.
   */
  loadSettingsIntoStore() {
    // load configuration from nodeObs to state
    const settingsFormData = {};
    this.getCategories().forEach(categoryName => {
      settingsFormData[categoryName] = this.fetchSettingsFromObs(categoryName);
    });
    this.SET_SETTINGS(settingsFormData);
  }

  /**
   * Audio settings are a special case where switching scene collections will
   * cause them to become invalid. Calling this function will ensure that the
   * audio settings are in sync with the currently loaded scene collection.
   */
  refreshAudioSettings() {
    this.PATCH_SETTINGS('Audio', {
      type: ESettingsCategoryType.Untabbed,
      formData: this.getAudioSettingsFormData(this.state['Audio'].formData[0]),
    });
  }

  showSettings(categoryName?: string) {
    this.windowsService.showWindow({
      componentName: 'Settings',
      title: $t('Settings'),
      queryParams: { categoryName },
      size: {
        width: 830,
        height: 800,
      },
    });
  }

  advancedSettingEnabled(): boolean {
    return Utils.isDevMode() || this.appService.state.argv.includes('--adv-settings');
  }

  getCategories(): string[] {
    let categories: string[] = obs.NodeObs.OBS_settings_getListCategories();
    categories = categories.concat([
      'Scene Collections',
      'Notifications',
      'Appearance',
      'Remote Control',
      'Virtual Webcam',
    ]);

    // Platform-specific categories
    byOS({
      [OS.Mac]: () => {},
      [OS.Windows]: () => {
        categories = categories.concat(['Game Overlay']);
      },
    });

    if (this.advancedSettingEnabled() || this.platformAppsService.state.devMode) {
      categories = categories.concat('Developer');
      categories = categories.concat(['Experimental']);
    }

    if (this.platformAppsService.state.loadedApps.filter(app => !app.unpacked).length > 0) {
      categories = categories.concat('Installed Apps');
    }

    return categories;
  }

  findSetting(settings: ISettingsSubCategory[], category: string, setting: string) {
    let inputModel: any;
    settings.find(subCategory => {
      if (subCategory.nameSubCategory === category) {
        subCategory.parameters.find(param => {
          if (param.name === setting) {
            inputModel = param;
            return true;
          }
        });

        return true;
      }
    });

    return inputModel;
  }

  findSettingValue(settings: ISettingsSubCategory[], category: string, setting: string) {
    const formModel = this.findSetting(settings, category, setting);
    if (!formModel) return;
    return formModel.value !== void 0
      ? formModel.value
      : (formModel as IObsListInput<string>).options[0].value;
  }

  findValidListValue(settings: ISettingsSubCategory[], category: string, setting: string) {
    const formModel = this.findSetting(settings, category, setting);
    if (!formModel) return;
    const options = (formModel as IObsListInput<string>).options;
    const option = options.find(option => option.value === formModel.value);
    return option ? option.value : options[0].value;
  }

  private patchSetting(
    settingsFormData: ISettingsSubCategory[],
    name: string,
    patch: Partial<IObsInput<TObsValue>>,
  ) {
    // tslint:disable-next-line
    settingsFormData = cloneDeep(settingsFormData);
    for (const subcategory of settingsFormData) {
      for (const field of subcategory.parameters) {
        if (field.name !== name) continue;
        Object.assign(field, patch);
      }
    }
    return settingsFormData;
  }

  setSettingValue(category: string, name: string, value: TObsValue) {
    const newSettings = this.patchSetting(this.fetchSettingsFromObs(category).formData, name, {
      value,
    });
    this.setSettings(category, newSettings);
  }

  private getAudioSettingsFormData(OBSsettings: ISettingsSubCategory): ISettingsSubCategory[] {
    // Make sure we are working with the latest devices plugged into the system
    this.hardwareService.refreshDevices(true);
    const audioDevices = this.audioService.getDevices();
    const sourcesInChannels = this.sourcesService.views
      .getSources()
      .filter(source => source.channel !== void 0);

    const parameters: TObsFormData = [];

    // collect output channels info
    for (let channel = E_AUDIO_CHANNELS.OUTPUT_1; channel <= E_AUDIO_CHANNELS.OUTPUT_2; channel++) {
      const source = sourcesInChannels.find(source => source.channel === channel);
      const deviceInd = channel;

      parameters.push({
        value: source ? source.getObsInput().settings['device_id'] : null,
        description: `${$t('Desktop Audio Device')} ${deviceInd}`,
        name: `Desktop Audio ${deviceInd > 1 ? deviceInd : ''}`,
        type: 'OBS_PROPERTY_LIST',
        enabled: true,
        visible: true,
        options: [{ description: 'Disabled', value: null }].concat(
          audioDevices
            .filter(device => device.type === EDeviceType.audioOutput)
            .map(device => {
              return { description: device.description, value: device.id };
            }),
        ),
      });
    }

    // collect input channels info
    for (let channel = E_AUDIO_CHANNELS.INPUT_1; channel <= E_AUDIO_CHANNELS.INPUT_3; channel++) {
      const source = sourcesInChannels.find(source => source.channel === channel);
      const deviceInd = channel - 2;

      parameters.push({
        value: source ? source.getObsInput().settings['device_id'] : null,
        description: `${$t('Mic/Auxiliary Device')} ${deviceInd}`,
        name: `Mic/Aux ${deviceInd > 1 ? deviceInd : ''}`,
        type: 'OBS_PROPERTY_LIST',
        enabled: true,
        visible: true,
        options: [{ description: 'Disabled', value: null }].concat(
          audioDevices
            .filter(device => device.type === EDeviceType.audioInput)
            .map(device => {
              return { description: device.description, value: device.id };
            }),
        ),
      });
    }

    return [
      OBSsettings,
      {
        parameters,
        nameSubCategory: 'Untitled',
      },
    ];
  }

  setSettings(categoryName: string, settingsData: ISettingsSubCategory[]) {
    if (categoryName === 'Audio') this.setAudioSettings([settingsData.pop()]);

    const dataToSave = [];

    for (const subGroup of settingsData) {
      dataToSave.push({
        ...subGroup,
        parameters: inputValuesToObsValues(subGroup.parameters, {
          valueToCurrentValue: true,
        }),
      });
    }

    obs.NodeObs.OBS_settings_saveSettings(categoryName, dataToSave);
    this.loadSettingsIntoStore();
  }

  setSettingsPatch(patch: DeepPartial<ISettingsValues>) {
    // Tech Debt: This is a product of the node-obs settings API.
    // This function represents a cleaner API we would like to have
    // in the future.

    Object.keys(patch).forEach(categoryName => {
      const category: Dictionary<any> = patch[categoryName];
      const formSubCategories = this.fetchSettingsFromObs(categoryName).formData;

      Object.keys(category).forEach(paramName => {
        formSubCategories.forEach(subCategory => {
          subCategory.parameters.forEach(subCategoryParam => {
            if (subCategoryParam.name === paramName) {
              subCategoryParam.value = category[paramName];
            }
          });
        });
      });

      this.setSettings(categoryName, formSubCategories);
    });
  }

  private setAudioSettings(settingsData: ISettingsSubCategory[]) {
    const audioDevices = this.audioService.getDevices();

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

  private ensureValidEncoder() {
    const encoderSetting: IObsListInput<string> =
      this.findSetting(this.state.Output.formData, 'Streaming', 'Encoder') ??
      this.findSetting(this.state.Output.formData, 'Streaming', 'StreamEncoder');
    const encoderIsValid = !!encoderSetting.options.find(opt => opt.value === encoderSetting.value);

    // The backend incorrectly defaults to obs_x264 in Simple mode rather x264.
    // In this case we shouldn't do anything here.
    if (encoderSetting.value === 'obs_x264') return;

    if (!encoderIsValid) {
      const mode: string = this.findSettingValue(this.state.Output.formData, 'Untitled', 'Mode');

      if (mode === 'Advanced') {
        this.setSettingValue('Output', 'Encoder', 'obs_x264');
      } else {
        this.setSettingValue('Output', 'StreamEncoder', 'x264');
      }

      electron.remote.dialog.showMessageBox(electron.remote.getCurrentWindow(), {
        type: 'error',
        message:
          'Your stream encoder has been reset to Software (x264). This can be caused by out of date graphics drivers. Please update your graphics drivers to continue using hardware encoding.',
      });
    }
  }

  @mutation()
  SET_SETTINGS(settingsData: ISettingsServiceState) {
    this.state = Object.assign({}, this.state, settingsData);
  }

  @mutation()
  PATCH_SETTINGS(categoryName: string, category: ISettingsCategory) {
    this.state[categoryName] = category;
  }
}
