import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import GenericFormGroups from 'components/obs/inputs/GenericFormGroups.vue';
import { ITcpServerServiceApi, ITcpServersSettings } from 'services/api/tcp-server';
import { ISettingsSubCategory } from 'services/settings';
import AppPlatformDeveloperSettings from 'components/AppPlatformDeveloperSettings.vue';
import { PlatformAppsService } from 'services/platform-apps';
import { TextInput } from 'components/shared/inputs/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';

@Component({
  components: {
    GenericFormGroups,
    VFormGroup,
    TextInput,
    AppPlatformDeveloperSettings,
  },
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
    return this.tcpServerService.state.token;
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
