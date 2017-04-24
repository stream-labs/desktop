import { StatefulService, mutation } from './stateful-service';
import Vue from 'vue';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs;



export default class SettingsService extends StatefulService {

  initialState = {};

  static convertFormDataToState(settingsFormData) {
    let settingsState = {};
    settingsFormData.forEach(group => {
      group.parameters.forEach(parameter => {
        settingsState[parameter.name] = parameter.currentValue;
      });
    });
    return settingsState;
  }


  static getListItemDescription (possibleValue) {
    return Object.keys(possibleValue)[0];
  }


  static getListItemName (possibleValue) {
    return possibleValue[Object.keys(possibleValue)[0]];
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

  @mutation
  setSettings (categoryName, settingsData) {
    nodeObs.OBS_settings_saveSettings(categoryName, settingsData);
    Vue.set(this.state, categoryName, SettingsService.convertFormDataToState(settingsData));
  }

}