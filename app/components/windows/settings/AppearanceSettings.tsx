import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import GenericForm from 'components/obs/inputs/GenericForm';
import { $t } from 'services/i18n';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import { ICustomizationServiceState, CustomizationService } from 'services/customization';
import { WindowsService } from 'services/windows';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import { UserService } from 'services/user';
import electron from 'electron';
import { MagicLinkService } from 'services/magic-link';

@Component({})
export default class AppearanceSettings extends Vue {
  @Inject() private customizationService: CustomizationService;
  @Inject() private windowsService: WindowsService;
  @Inject() private userService: UserService;
  @Inject() private magicLinkService: MagicLinkService;

  settingsFormData: TObsFormData = null;
  enableFFZEmotes = false;

  get themeMetadata() {
    return metadata.list({
      title: $t('Theme'),
      name: 'theme',
      options: this.customizationService.themeOptions,
    });
  }

  get themeValue() {
    return this.customizationService.state.theme;
  }

  set themeValue(val: string) {
    this.customizationService.actions.setSettings({ theme: val });
  }

  created() {
    this.settingsFormData = this.customizationService.views.settingsFormData;
    this.enableFFZEmotes = this.customizationService.state.enableFFZEmotes;
  }

  saveSettings(formData: TObsFormData) {
    const settings: Partial<ICustomizationServiceState> = {};
    formData.forEach(formInput => {
      settings[formInput.name] = formInput.value;
    });
    this.customizationService.setSettings(settings);
    this.settingsFormData = this.customizationService.views.settingsFormData;
    this.enableFFZEmotes = this.customizationService.state.enableFFZEmotes;
  }

  openFFZSettings() {
    this.windowsService.createOneOffWindow(
      {
        componentName: 'FFZSettings',
        title: $t('FrankerFaceZ Settings'),
        queryParams: {},
        size: {
          width: 800,
          height: 800,
        },
      },
      'ffz-settings',
    );
  }

  async upgradeToPrime() {
    const link = await this.magicLinkService.getDashboardMagicLink(
      'prime-marketing',
      'slobs-ui-themes',
    );
    electron.remote.shell.openExternal(link);
  }

  render() {
    return (
      <div>
        <div class="section">
          <div class="section-content">
            <VFormGroup metadata={this.themeMetadata} vModel={this.themeValue} />
            {this.userService.views.isLoggedIn && !this.userService.views.isPrime && (
              <div style={{ marginBottom: '16px' }}>
                <a style={{ color: 'var(--prime)' }} onClick={() => this.upgradeToPrime()}>
                  <i style={{ color: 'var(--prime)' }} class="icon-prime" />
                  {$t('Change the look of Streamlabs OBS with Prime')}
                </a>
              </div>
            )}
          </div>
        </div>
        <div class="section">
          <div class="section-content">
            <GenericForm value={this.settingsFormData} onInput={this.saveSettings} />
          </div>
        </div>
        {this.enableFFZEmotes && (
          <div class="section">
            <button class="button button--action" onClick={this.openFFZSettings}>
              {$t('Open FrankerFaceZ Settings')}
            </button>
          </div>
        )}
      </div>
    );
  }
}
