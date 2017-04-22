import Service from './service';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs;

export default class SettingsService extends Service {

  getCategories () {
    return nodeObs.OBS_settings_getListCategories();
  }

  getSettings (categoryName) {
    let settings = nodeObs.OBS_settings_getSettings(categoryName);
    console.log(settings);
    // set default values for lists
    settings.forEach(group => {
      group.parameters.forEach(parameter => {
        let needToSetDefaultValue = parameter.values && !parameter.values.find(possibleValue => {
            if (parameter.currentValue == this.getListItemName(possibleValue)) return true;
        });
        if (needToSetDefaultValue) parameter.currentValue = this.getListItemName(parameter.values[0]);
      });
    });

    return settings;
  }

  setSettings (categoryName, settingsData) {
    console.log(settingsData);
    return nodeObs.OBS_settings_saveSettings(categoryName, settingsData);
  }

  getListItemDescription(possibleValue) {
    return Object.keys(possibleValue)[0];
  }

  getListItemName(possibleValue) {
    return possibleValue[Object.keys(possibleValue)[0]];
  }
}