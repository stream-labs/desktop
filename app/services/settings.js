import { StatefulService, action, mutation } from './stateful-service';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs;



export default class SettingsService extends StatefulService {

  state = {};

  getCategories () {
    return nodeObs.OBS_settings_getListCategories();
  }

  getSettings (categoryName) {
    let settings = nodeObs.OBS_settings_getSettings(categoryName);

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

  @action
  setSettings (categoryName, settingsData) {
    this.SET_SETTINGS(categoryName, settingsData);
  }

  @mutation
  SET_SETTINGS(categoryName, settingsData) {
    nodeObs.OBS_settings_saveSettings(categoryName, settingsData);
    this.state.categoryName = settingsData;
  }


  getListItemDescription (possibleValue) {
    return Object.keys(possibleValue)[0];
  }

  getListItemName (possibleValue) {
    return possibleValue[Object.keys(possibleValue)[0]];
  }
}