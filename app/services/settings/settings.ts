import { invert, cloneDeep } from 'lodash';
import { StatefulService, mutation } from 'services/stateful-service';
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
import { Inject } from '../../util/injector';
import { AudioService, E_AUDIO_CHANNELS } from 'services/audio';
import { WindowsService } from 'services/windows';
import Utils from '../utils';
import { AppService } from 'services/app';
import { $t } from 'services/i18n';
import {
  encoderFieldsMap,
  StreamEncoderSettingsService,
  obsEncoderToEncoder,
} from './stream-encoder';
import { VideoEncodingOptimizationService } from 'services/video-encoding-optimizations';
import { ISettingsServiceApi, ISettingsSubCategory } from './settings-api';
import { PlatformAppsService } from 'services/platform-apps';
import { EDeviceType } from 'services/hardware';
import { StreamingService } from 'services/streaming';

export interface ISettingsState {
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
  };
  Output: {
    RecRB?: boolean;
    RecRBTime?: number;
  };
  Video: {
    Base: string;
  };
  Audio: Dictionary<TObsValue>;
  Advanced: {
    DelayEnable: boolean;
    DelaySec: number;
  };
}

declare type TSettingsFormData = Dictionary<ISettingsSubCategory[]>;

export class SettingsService extends StatefulService<ISettingsState>
  implements ISettingsServiceApi {
  static initialState = {};

  static convertFormDataToState(settingsFormData: TSettingsFormData): ISettingsState {
    const settingsState: Partial<ISettingsState> = {};
    for (const groupName in settingsFormData) {
      settingsFormData[groupName].forEach(subGroup => {
        subGroup.parameters.forEach(parameter => {
          settingsState[groupName] = settingsState[groupName] || {};
          settingsState[groupName][parameter.name] = parameter.value;
        });
      });
    }

    return settingsState as ISettingsState;
  }

  @Inject() private sourcesService: SourcesService;
  @Inject() private audioService: AudioService;
  @Inject() private windowsService: WindowsService;
  @Inject() private appService: AppService;
  @Inject() private platformAppsService: PlatformAppsService;
  @Inject() private streamEncoderSettingsService: StreamEncoderSettingsService;
  @Inject() private streamingService: StreamingService;

  @Inject()
  private videoEncodingOptimizationService: VideoEncodingOptimizationService;

  init() {
    this.loadSettingsIntoStore();
  }

  loadSettingsIntoStore() {
    // load configuration from nodeObs to state
    const settingsFormData = {};
    this.getCategories().forEach(categoryName => {
      settingsFormData[categoryName] = this.getSettingsFormData(categoryName);
    });
    this.SET_SETTINGS(SettingsService.convertFormDataToState(settingsFormData));
  }

  showSettings(categoryName?: string) {
    this.windowsService.showWindow({
      componentName: 'Settings',
      title: $t('Settings'),
      queryParams: { categoryName },
      size: {
        width: 800,
        height: 800,
      },
    });
  }

  advancedSettingEnabled(): boolean {
    return Utils.isDevMode() || this.appService.state.argv.includes('--adv-settings');
  }

  getCategories(): string[] {
    let categories = obs.NodeObs.OBS_settings_getListCategories();
    categories = categories.concat([
      'Scene Collections',
      'Notifications',
      'Appearance',
      'Remote Control',
    ]);

    if (this.advancedSettingEnabled() || this.platformAppsService.state.devMode) {
      categories = categories.concat('Developer');
      categories = categories.concat(['Experimental']);
    }

    if (this.platformAppsService.state.loadedApps.filter(app => !app.unpacked).length > 0) {
      categories = categories.concat('Installed Apps');
    }

    return categories;
  }

  getSettingsFormData(categoryName: string): ISettingsSubCategory[] {
    if (categoryName === 'Audio') return this.getAudioSettingsFormData();
    let settings = obs.NodeObs.OBS_settings_getSettings(categoryName);

    // Names of settings that are disabled because we
    // have not implemented them yet.
    const BLACK_LIST_NAMES = [
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
        disabledFields: BLACK_LIST_NAMES,
        transformListOptions: true,
      });
    }

    // We hide the encoder preset and settings if the optimized ones are in used
    if (
      categoryName === 'Output' &&
      !this.streamingService.isIdle &&
      this.videoEncodingOptimizationService.state.useOptimizedProfile
    ) {
      const encoder = obsEncoderToEncoder(
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

    return settings;
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
    const newSettings = this.patchSetting(this.getSettingsFormData(category), name, { value });
    this.setSettings(category, newSettings);
  }

  private getAudioSettingsFormData(): ISettingsSubCategory[] {
    const audioDevices = this.audioService.getDevices();
    const sourcesInChannels = this.sourcesService
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
      {
        parameters,
        nameSubCategory: 'Untitled',
      },
    ];
  }

  setSettings(categoryName: string, settingsData: ISettingsSubCategory[]) {
    if (categoryName === 'Audio') return this.setAudioSettings(settingsData);

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

  setSettingsPatch(patch: Partial<ISettingsState>) {
    // Tech Debt: This is a product of the node-obs settings API.
    // This function represents a cleaner API we would like to have
    // in the future.

    Object.keys(patch).forEach(categoryName => {
      const category: Dictionary<any> = patch[categoryName];
      const formSubCategories = this.getSettingsFormData(categoryName);

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
      const source = this.sourcesService.getSources().find(source => source.channel === channel);

      if (source && deviceForm.value === null) {
        if (deviceForm.value === null) {
          this.sourcesService.removeSource(source.sourceId);
          return;
        }
      } else if (deviceForm.value !== null) {
        const device = audioDevices.find(device => device.id === deviceForm.value);
        const displayName = device.id === 'default' ? deviceForm.name : device.description;

        if (!source) {
          this.sourcesService.createSource(
            displayName,
            isOutput ? 'wasapi_output_capture' : 'wasapi_input_capture',
            {},
            { channel },
          );
        } else {
          source.setName(displayName);
          source.updateSettings({ device_id: deviceForm.value });
        }
      }
    });
  }

  @mutation()
  SET_SETTINGS(settingsData: ISettingsState) {
    this.state = Object.assign({}, this.state, settingsData);
  }
}
