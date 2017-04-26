import { StatefulService, mutation } from './stateful-service';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs;


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

  init() {
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
    let settings = nodeObs.OBS_settings_getSettings(categoryName);
    const BLACK_LIST_CATEGORIES = ['General'];
    const groupIsBlacklisted = BLACK_LIST_CATEGORIES.includes(categoryName);

    // set default values for lists, and disable the blacklisted fields
    settings.forEach(group => {
      group.parameters.forEach(parameter => {
        if (groupIsBlacklisted) parameter.enabled = 0;
        let needToSetDefaultValue = parameter.values && !parameter.values.find(possibleValue => {
            if (parameter.currentValue == SettingsService.getListItemName(possibleValue)) return true;
          });
        if (needToSetDefaultValue) parameter.currentValue = SettingsService.getListItemName(parameter.values[0]);
      });
    });
    return settings;
  }

  setSettings (categoryName, settingsData) {
    nodeObs.OBS_settings_saveSettings(categoryName, settingsData);
    this.SET_SETTINGS(SettingsService.convertFormDataToState({[categoryName]: settingsData}));
  }

  @mutation
  SET_SETTINGS (settingsData) {
    this.patchState(settingsData);
  }

}
