import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../services/core/injector';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import { $t } from 'services/i18n';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import { ICustomizationServiceApi, ICustomizationSettings } from 'services/customization';
import { WindowsService } from 'services/windows';

@Component({})
export default class AppearanceSettings extends Vue {
  @Inject() private customizationService: ICustomizationServiceApi;
  @Inject() private windowsService: WindowsService;

  settingsFormData: TObsFormData = null;
  enableFFZEmotes = false;

  created() {
    this.settingsFormData = this.customizationService.getSettingsFormData();
    this.enableFFZEmotes = this.customizationService.getSettings().enableFFZEmotes;
  }

  saveSettings(formData: TObsFormData) {
    const settings: Partial<ICustomizationSettings> = {};
    formData.forEach(formInput => {
      settings[formInput.name] = formInput.value;
    });
    this.customizationService.setSettings(settings);
    this.settingsFormData = this.customizationService.getSettingsFormData();
    this.enableFFZEmotes = this.customizationService.getSettings().enableFFZEmotes;
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

  render(h: Function) {
    return (
      <div>
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
