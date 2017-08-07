import { StatefulService, mutation } from './stateful-service';
import { obsValuesToInputValues, inputValuesToObsValues, TObsValue, TFormData } from '../components/shared/forms/Input';
import { nodeObs } from './obs-api';

export interface ISettingsSubCategory {
  nameSubCategory: string;
  parameters: TFormData;
}

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
  };
  Stream: {
    key: string;
  };
  Output: Dictionary<TObsValue>;
  Video: {
    Base: string;
  };
  Audio: Dictionary<TObsValue>;
  Hotkeys: Dictionary<TObsValue>;
  Advanced: Dictionary<TObsValue>;
}

declare type TSettingsFormData = Dictionary<ISettingsSubCategory[]>;


export class SettingsService extends StatefulService<ISettingsState> {

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


  getCategories(): string[] {
    return nodeObs.OBS_settings_getListCategories();
  }


  getSettingsFormData(categoryName: string): ISettingsSubCategory[] {
    const settings = nodeObs.OBS_settings_getSettings(categoryName);

    // Names of settings that are disabled because we
    // have not implemented them yet.
    const BLACK_LIST_NAMES = [
      'SysTrayMinimizeToTray',
      'ReplayBufferWhileStreaming',
      'KeepReplayBufferStreamStops',
      'SysTrayEnabled',
      'CenterSnapping',
      'HideProjectorCursor',
      'ProjectorAlwaysOnTop',
      'SaveProjectors',
      'SysTrayWhenStarted',
      'RecRBSuffix',
      'LowLatencyEnable',
      'BindIP',
      'FilenameFormatting',
      'DelayPreserve',
      'DelaySec',
      'DelayEnable',
      'MaxRetries',
      'MonitoringDeviceName',
      'NewSocketLoopEnable',
      'OverwriteIfExists',
      'ProcessPriority',
      'RecRBPrefix',
      'Reconnect',
      'RetryDelay'
    ];

    for (const group of settings) {
      group.parameters = obsValuesToInputValues(group.parameters, {
        disabledFields: BLACK_LIST_NAMES,
        transformListOptions: true
      });
    }

    return settings;
  }

  setSettings(categoryName: string, settingsData: ISettingsSubCategory[]) {
    const dataToSave = [];

    for (const subGroup of settingsData) {
      dataToSave.push({ ...subGroup, parameters: inputValuesToObsValues(
        subGroup.parameters,
        { valueToCurrentValue: true }
      )});
    }
    nodeObs.OBS_settings_saveSettings(categoryName, dataToSave);
    this.SET_SETTINGS(SettingsService.convertFormDataToState({ [categoryName]: settingsData }));
  }

  @mutation()
  SET_SETTINGS(settingsData: ISettingsState) {
    this.state = Object.assign({}, this.state, settingsData);
  }

}
