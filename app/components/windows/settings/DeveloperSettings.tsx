import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import GenericFormGroups from 'components/obs/inputs/GenericFormGroups.vue';
import { ITcpServerServiceApi, ITcpServersSettings } from 'services/api/tcp-server/index';
import { ISettingsSubCategory } from 'services/settings/index';
import AppPlatformDeveloperSettings from 'components/AppPlatformDeveloperSettings.vue';
import { PlatformAppsService } from 'services/platform-apps/index';
import { TextInput } from 'components/shared/inputs/inputs';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { $t } from 'services/i18n/index';

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

  render() {
    return (
      <div>
        {this.appDeveloperMode && (
          <div class="section">
            <AppPlatformDeveloperSettings />
          </div>
        )}

        <div class="section">
          <button class="button button--soft-warning" onClick={this.restoreDefaults}>
            {$t('Restore Defaults')}
          </button>
        </div>

        <div class="section">
          <div class="section-content">
            <VFormGroup metadata={{ title: $t('API Token') }}>
              <TextInput value={this.tokenInput} metadata={{ masked: true }}>
                <button class="button button--default" onClick={this.generateToken}>
                  {$t('Update')}
                </button>
              </TextInput>
            </VFormGroup>
          </div>
        </div>

        <GenericFormGroups value={this.settingsFormData} onInput={this.save} />
      </div>
    );
  }
}
