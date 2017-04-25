import Service from './service';
import Obs from '../api/Obs';

const { remote } = window.require('electron');
const nodeObs = Obs.nodeObs;

export default class SettingsService extends Service {

  getCategories () {
    return nodeObs.OBS_settings_getListCategories();
  }

  getSettings (categoryName) {
    let settings = nodeObs.OBS_settings_getSettings(categoryName, remote.app.getPath('userData') + '\\');
    const BLACK_LIST_CATEGORIES = ['General'];
    const groupIsBlacklisted = BLACK_LIST_CATEGORIES.includes(categoryName);

    // set default values for lists, and disable the blacklisted fields
    settings.forEach(group => {
      group.parameters.forEach(parameter => {
        if (groupIsBlacklisted) parameter.enabled = 0;
        let needToSetDefaultValue = parameter.values && !parameter.values.find(possibleValue => {
            if (parameter.currentValue == this.getListItemName(possibleValue)) return true;
        });
        if (needToSetDefaultValue) parameter.currentValue = this.getListItemName(parameter.values[0]);
      });
    });
    return settings;
  }

  setSettings (categoryName, settingsData) {
    return nodeObs.OBS_settings_saveSettings(categoryName, settingsData, remote.app.getPath('userData') + '\\');
  }

  getListItemDescription(possibleValue) {
    return Object.keys(possibleValue)[0];
  }

  getListItemName(possibleValue) {
    return possibleValue[Object.keys(possibleValue)[0]];
  }
}