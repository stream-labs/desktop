import Service from './service';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs;

export default class SettingsService extends Service {

  getCategories () {
    return nodeObs.OBS_settings_getListCategories();
  }

  getSettings (categoryName) {
    let settings = nodeObs.OBS_settings_getSettings(categoryName);

    // set default values for lists
    for (let group of settings) {
      for (let parameter of group.parameters) {
        let needToSetDefaultValue = parameter.values && !parameter.values.includes(parameter.values);
        if (needToSetDefaultValue) parameter.currentValue = parameter.values[0];
      }
    }
    return settings;
  }

  setSettings (categoryName, settingsData) {
    return nodeObs.OBS_settings_saveSettings(categoryName, settingsData);
  }
}