import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import GenericForm from 'components/obs/inputs/GenericForm';
import { TObsFormData, TObsValue } from 'components/obs/inputs/ObsInput';
import { ICustomizationServiceApi, ICustomizationServiceState } from 'services/customization';
import { ScenesService } from 'services/scenes';
import electron from 'electron';

@Component({
  components: { GenericForm },
})
export default class ExperimentalSettings extends Vue {
  @Inject() private customizationService: ICustomizationServiceApi;
  @Inject() private scenesService: ScenesService;

  settingsFormData: TObsFormData = null;

  created() {
    this.settingsFormData = this.customizationService.getExperimentalSettingsFormData();
  }

  saveSettings(formData: TObsFormData) {
    const settings: Dictionary<TObsValue> = {};
    formData.forEach(formInput => {
      settings[formInput.name] = formInput.value;
    });
    this.customizationService.setSettings({
      experimental: settings as ICustomizationServiceState['experimental'],
    });
    this.settingsFormData = this.customizationService.getExperimentalSettingsFormData();
  }

  repairSceneCollection() {
    this.scenesService.repair();
    electron.remote.dialog.showMessageBox(electron.remote.getCurrentWindow(), {
      message: 'Repair finished. See details in the log file',
    });
  }
}
