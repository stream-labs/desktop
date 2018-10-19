import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import GenericFormGroups from './obs/inputs/GenericFormGroups.vue';
import ObsTextInput from './obs/inputs/ObsTextInput.vue';
import { ITcpServerServiceApi, ITcpServersSettings } from 'services/tcp-server';
import { ISettingsSubCategory } from 'services/settings';
import AppPlatformDeveloperSettings from 'components/AppPlatformDeveloperSettings.vue';
import { PlatformAppsService } from 'services/platform-apps';

@Component({
  components: {
    GenericFormGroups,
    ObsTextInput,
    AppPlatformDeveloperSettings
  }
})
export default class DeveloperSettings extends Vue {

  @Inject() tcpServerService: ITcpServerServiceApi;
  @Inject() platformAppsService: PlatformAppsService;

  settingsFormData: ISettingsSubCategory[] = null;

  created() {
    // Stop listening for security reasons
    this.tcpServerService.stopListening();
    this.settingsFormData = this.getApiSettingsFormData();
  }

  get tokenInput() {
    return {
      description: 'API Token',
      value: this.tcpServerService.state.token,
      masked: true
    };
  }

  generateToken() {
    this.tcpServerService.generateToken();
  }

  destroyed() {
    this.tcpServerService.listen();
  }

  get appDeveloperMode() {
    return this.platformAppsService.state.devMode;
  }

  restoreDefaults() {
    this.tcpServerService.setSettings(this.tcpServerService.getDefaultSettings());
    this.settingsFormData = this.getApiSettingsFormData();
  }


  save(settingsData: ISettingsSubCategory[]) {
    const settings: Partial<ITcpServersSettings> = {};
    settingsData.forEach(subCategory => {
      subCategory.parameters.forEach(parameter => {
        if (!settings[subCategory.codeSubCategory]) settings[subCategory.codeSubCategory] = {};
        settings[subCategory.codeSubCategory][parameter.name] = parameter.value;
      });
    });
    this.tcpServerService.setSettings(settings);
    this.settingsFormData = this.getApiSettingsFormData();
  }

  private getApiSettingsFormData(): ISettingsSubCategory[] {
    return this.tcpServerService.getApiSettingsFormData();
  }

}
