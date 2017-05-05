<template>
<div class="StartupSettings">
  <bool-input
    :value="obsMode"
    @input="val => saveSetting(val, 'obsMode')"/>
  <list-input
    :value="profile"
    @input="val => saveSetting(val, 'profile')"/>
  <list-input
    :value="sceneCollection"
    @input="val => saveSetting(val, 'sceneCollection')"/>
  <p>
    These settings will take effect when the application is relaunched.
  </p>
  <button class="button button--action" @click="restartApp">
    Relaunch Now
  </button>
</div>
</template>

<script>
// This component is temporary and will be removed before release

import { BoolInput, ListInput } from './shared/forms';
import Obs from '../api/Obs';

const { remote, ipcRenderer } = window.require('electron');
const path = window.require('path');
const fs = window.require('fs');

export default {

  components: {
    BoolInput,
    ListInput
  },

  data() {
    const profileOptions = Obs.getObsProfiles().map(profile => {
      return { [profile]: profile };
    });

    const sceneCollectionOptions = Obs.getObsSceneCollections().map(coll => {
      return { [coll]: coll };
    });

    this.settingsPath = path.join(remote.app.getPath('userData'), 'startup.json');

    let settings;

    if (fs.existsSync(this.settingsPath)) {
      settings = this.loadSettings();
    } else {
      // Ensure we have default settings
      settings = {
        obsMode: 0,
        profile: Object.keys(profileOptions[0])[0],
        sceneCollection: Object.keys(sceneCollectionOptions[0])[0]
      };

      fs.writeFileSync(this.settingsPath, JSON.stringify(settings));
    }

    return {
      obsMode: {
        description: 'Load configuration from OBS',
        currentValue: settings.obsMode,
        enabled: true
      },

      profile: {
        values: profileOptions,
        description: 'OBS Profile',
        currentValue: settings.profile
      },

      sceneCollection: {
        values: sceneCollectionOptions,
        description: 'OBS Scene Collection',
        currentValue: settings.sceneCollection
      }
    };
  },

  methods: {
    loadSettings() {
      return JSON.parse(fs.readFileSync(this.settingsPath));
    },

    saveSetting(val, attr) {
      const settings = this.loadSettings();
      settings[attr] = val.currentValue;
      fs.writeFileSync(this.settingsPath, JSON.stringify(settings));
      this[attr].currentValue = val.currentValue;
    },

    restartApp() {
      ipcRenderer.send('restartApp');
    }
  }

};

</script>

<style lang="less" scoped>
@import "../styles/index";

.StartupSettings {
  margin-bottom: 20px;
  background-color: @panel-bg-color;
  border: 1px solid @panel-border-color;
  padding: 20px 30px;
}
</style>
