import { StatefulService, mutation } from './stateful-service';
import { obsValuesToInputValues, inputValuesToObsValues } from '../components/shared/forms/Input';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs;

export default class SettingsService extends StatefulService {

  static convertFormDataToState(settingsFormData) {
    let settingsState = {};
    for (let groupName in settingsFormData) {
      settingsFormData[groupName].forEach(subGroup => {
        subGroup.parameters.forEach(parameter => {
          settingsState[groupName] = settingsState[groupName] || {};
          settingsState[groupName][parameter.name] = parameter.value;
        });
      });
    }

    return settingsState;
  }

  loadSettingsIntoStore() {
    // load configuration from nodeObs to state
    let settingsFormData = {};
    this.getCategories().forEach(categoryName => {
      settingsFormData[categoryName] = this.getSettingsFormData(categoryName);
    });
    this.SET_SETTINGS(SettingsService.convertFormDataToState(settingsFormData));
  }


  getCategories() {
    return nodeObs.OBS_settings_getListCategories();
  }


  getSettingsFormData(categoryName) {
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

  setSettings(categoryName, settingsData) {
    for (const subGroup of settingsData) {
      subGroup.parameters = inputValuesToObsValues(subGroup.parameters);
    }
    nodeObs.OBS_settings_saveSettings(categoryName, settingsData);
    this.SET_SETTINGS(SettingsService.convertFormDataToState({ [categoryName]: settingsData }));
  }

  @mutation
  SET_SETTINGS(settingsData) {
    this.patchState(settingsData);
  }

}
