import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import GenericForm from 'components/obs/inputs/GenericForm';
import { $t } from 'services/i18n';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import { ISettingsSubCategory, SettingsService } from 'services/settings';
import TsxComponent from 'components/tsx-component';
import { StreamSettingsService } from '../../../services/settings/streaming';
import GenericFormGroups from '../../obs/inputs/GenericFormGroups.vue';

@Component({ components: { GenericFormGroups } })
export default class StreamSettings extends TsxComponent {
  @Inject() private streamSettingsService: StreamSettingsService;

  created() {
    // this.settingsFormData = this.customizationService.getSettingsFormData();
    // this.enableFFZEmotes = this.customizationService.getSettings().enableFFZEmotes;
  }

  saveObsSettings(obsSettings: ISettingsSubCategory[]) {
    // const settings: Partial<ICustomizationSettings> = {};
    // formData.forEach(formInput => {
    //   settings[formInput.name] = formInput.value;
    // });
    // this.customizationService.setSettings(settings);
    // this.settingsFormData = this.customizationService.getSettingsFormData();
    // this.enableFFZEmotes = this.customizationService.getSettings().enableFFZEmotes;
    this.streamSettingsService.setObsSettings(obsSettings);
  }

  render() {
    return (
      <div>
        <GenericFormGroups value={this.streamSettingsService.getObsSettings()} onInput={this.saveObsSettings} />
      </div>
    );
  }
}
