import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import { $t } from 'services/i18n';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import { ICustomizationServiceApi, ICustomizationSettings } from 'services/customization';
import { WindowsService } from 'services/windows';

@Component({
  components: { GenericForm }
})
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
    this.windowsService.createOneOffWindow({
      componentName: 'FFZSettings',
      title: $t('FrankerFaceZ Settings'),
      queryParams: {},
      size: {
        width: 800,
        height: 800
      }
    }, 'ffz-settings');
  }
}