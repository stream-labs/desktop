<template>
<div class="StartupSettings" v-if="enabled">
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
    const obsInstalled = Obs.isObsInstalled();

    if (obsInstalled) {
      const profileOptions = Obs.getObsProfiles().map(profile => {
        return {
          value: profile,
          description: profile
        };
      });

      const sceneCollectionOptions = Obs.getObsSceneCollections().map(coll => {
        return {
          value: coll,
          description: coll
        };
      });

      this.settingsPath = path.join(remote.app.getPath('userData'), 'startup.json');

      let settings;

      if (fs.existsSync(this.settingsPath)) {
        settings = this.loadSettings();

        // Support legacy file format:
        settings.obsMode = !!settings.obsMode;
      } else {
        // Ensure we have default settings
        settings = {
          obsMode: false,
          profile: profileOptions[0].value,
          sceneCollection: sceneCollectionOptions[0].value
        };

        fs.writeFileSync(this.settingsPath, JSON.stringify(settings));
      }

      return {
        enabled: true,

        obsMode: {
          description: 'Load configuration from OBS',
          value: settings.obsMode,
          enabled: true
        },

        profile: {
          options: profileOptions,
          description: 'OBS Profile',
          value: settings.profile
        },

        sceneCollection: {
          options: sceneCollectionOptions,
          description: 'OBS Scene Collection',
          value: settings.sceneCollection
        }
      };
    }

    return {
      enabled: false
    };
  },

  methods: {
    loadSettings() {
      return JSON.parse(fs.readFileSync(this.settingsPath));
    },

    saveSetting(val, attr) {
      const settings = this.loadSettings();
      settings[attr] = val.value;
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
