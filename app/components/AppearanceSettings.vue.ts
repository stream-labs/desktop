import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import GenericForm from './shared/forms/GenericForm.vue';
import { TFormData } from './shared/forms/Input';
import { ICustomizationServiceApi, ICustomizationSettings } from 'services/customization';

@Component({
  components: { GenericForm }
})
export default class AppearanceSettings extends Vue {

  @Inject() private customizationService: ICustomizationServiceApi;

  settingsFormData: TFormData = null;


  created() {
    this.settingsFormData = this.customizationService.getSettingsFormData();
  }


  saveSettings(formData: TFormData) {
    const settings: Partial<ICustomizationSettings> = {};
    formData.forEach(formInput => {
      settings[formInput.name] = formInput.value;
    });
    this.customizationService.setSettings(settings);
    this.settingsFormData = this.customizationService.getSettingsFormData();
  }



  restoreDefaults() {
    this.customizationService.restoreDefaults();
    this.settingsFormData = this.customizationService.getSettingsFormData();
  }

}
