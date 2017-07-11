<template>
<div>
  <div class="section" v-if="enabled">
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
  <div class="section" v-if="enabled">
    <p>
      If you are experiencing weird behavior, you can try deleting your cache directory.  This will result in you losing your scene configuration and settings, but can fix some stability issues.  The application can not be running when you delete your cache directory.
    </p>
    <button class="button button--action" @click="showCacheDir">
      Show Cache Directory
    </button>
  </div>
</div>
</template>

<script lang="ts">
// This component is temporary and will be removed before release

import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { BoolInput, ListInput } from './shared/forms';
import { ObsApiService } from '../services/obs-api';
import { Inject } from '../services/service';
import electron from '../vendor/electron';
import { IInputValue, IListInputValue, TObsValue } from "./shared/forms/Input";

const { remote, ipcRenderer } = electron;
const path = window['require']('path');
const fs = window['require']('fs');

@Component({
  components: {
    BoolInput,
    ListInput
  }
})
export default class StartupSettings extends Vue {

  obsApiService: ObsApiService = ObsApiService.instance;

  settingsPath: string;
  enabled = false;

  obsMode: IInputValue<boolean> = null;
  profile: IListInputValue = null;
  sceneCollection: IListInputValue = null;


  created() {
    const obsInstalled = this.obsApiService.isObsInstalled();

    if (obsInstalled) {
      const profileOptions = this.obsApiService.getObsProfiles().map(profile => {
        return {
          value: profile,
          description: profile
        };
      });

      const sceneCollectionOptions = this.obsApiService.getObsSceneCollections().map(coll => {
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

      this.enabled = true;

      this.obsMode = {
        name: '',
        description: 'Load configuration from OBS',
        value: settings.obsMode,
        enabled: true
      };

      this.profile = {
        name: '',
        options: profileOptions,
        description: 'OBS Profile',
        value: settings.profile
      };

      this.sceneCollection = {
        name: '',
        options: sceneCollectionOptions,
        description: 'OBS Scene Collection',
        value: settings.sceneCollection
      };
      return;
    }

    this.enabled = false;
  }

  loadSettings() {
    return JSON.parse(fs.readFileSync(this.settingsPath));
  }

  saveSetting(val: any, attr: string) {
    const settings = this.loadSettings();
    settings[attr] = val.value;
    fs.writeFileSync(this.settingsPath, JSON.stringify(settings));
    this[attr].currentValue = val.currentValue;
  }

  restartApp() {
    ipcRenderer.send('restartApp');
  }

  showCacheDir() {
    remote.shell.showItemInFolder(remote.app.getPath('userData'));
  }

}
</script>
