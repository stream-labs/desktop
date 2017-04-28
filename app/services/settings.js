import { StatefulService, stateful, mutation } from './stateful-service';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs;
const { remote } = window.require('electron');

@stateful
export default class SettingsService extends StatefulService {

  initialState = {};

  static convertFormDataToState (settingsFormData) {
    let settingsState = {};
    for (let groupName in settingsFormData) {
      settingsFormData[groupName].forEach(subGroup => {
        subGroup.parameters.forEach(parameter => {
          settingsState[groupName] = settingsState[groupName] || {};
          settingsState[groupName][parameter.name] = parameter.currentValue;
        });
      });
    }

    return settingsState;
  }


  static getListItemDescription (possibleValue) {
    return Object.keys(possibleValue)[0];
  }


  static getListItemName (possibleValue) {
    return possibleValue[Object.keys(possibleValue)[0]];
  }


  loadSettingsIntoStore() {
    // load configuration from nodeObs to state
    let settingsFormData = {};
    this.getCategories().forEach(categoryName => {
      settingsFormData[categoryName] = this.getSettingsFormData(categoryName);
    });
    this.SET_SETTINGS(SettingsService.convertFormDataToState(settingsFormData));
  }


  getCategories () {
    return nodeObs.OBS_settings_getListCategories();
  }


  getSettingsFormData (categoryName) {
    let settings = nodeObs.OBS_settings_getSettings(categoryName, remote.app.getPath('userData') + '\\');

    // Names of settings that are disabled because we
    // have not implemented them yet.
    const BLACK_LIST_NAMES = [
      'SysTrayMinimizeToTray',
      'ReplayBufferWhileStreaming',
      'KeepReplayBufferStreamStops',
      'SysTrayEnabled',
      'SourceSnapping',
      'CenterSnapping',
      'HideProjectorCursor',
      'ProjectorAlwaysOnTop',
      'SaveProjectors',
      'SysTrayWhenStarted',
    ];

    // set default values for lists, and disable the blacklisted fields
    settings.forEach(group => {
      group.parameters.forEach(parameter => {
        if (BLACK_LIST_NAMES.includes(parameter.name)) {
          parameter.enabled = 0;
        }

        let needToSetDefaultValue = parameter.values && !parameter.values.find(possibleValue => {
            if (parameter.currentValue == SettingsService.getListItemName(possibleValue)) return true;
          });
        if (needToSetDefaultValue) parameter.currentValue = SettingsService.getListItemName(parameter.values[0]);
      });
    });
    return settings;
  }

  setSettings (categoryName, settingsData) {
    nodeObs.OBS_settings_saveSettings(categoryName, settingsData, remote.app.getPath('userData') + '\\');
    this.SET_SETTINGS(SettingsService.convertFormDataToState({[categoryName]: settingsData}));
  }

  @mutation
  SET_SETTINGS (settingsData) {
    this.patchState(settingsData);
  }

}
