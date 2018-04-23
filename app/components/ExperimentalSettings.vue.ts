import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import GenericForm from './shared/forms/GenericForm.vue';
import { TFormData, TObsValue } from './shared/forms/Input';
import { ICustomizationServiceApi } from 'services/customization';

@Component({
  components: { GenericForm }
})
export default class ExperimentalSettings extends Vue {

  @Inject() private customizationService: ICustomizationServiceApi;

  settingsFormData: TFormData = null;


  created() {
    this.settingsFormData = this.customizationService.getExperimentalSettingsFormData();
  }


  saveSettings(formData: TFormData) {
    const settings: Dictionary<TObsValue> = {};
    formData.forEach(formInput => {
      settings[formInput.name] = formInput.value;
    });
    this.customizationService.setSettings({ experimental: settings });
    this.settingsFormData = this.customizationService.getExperimentalSettingsFormData();
  }

}
