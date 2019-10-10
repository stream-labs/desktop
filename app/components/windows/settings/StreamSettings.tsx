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
  private obsSettings = this.streamSettingsService.getObsSettings();

  saveObsSettings(obsSettings: ISettingsSubCategory[]) {
    this.streamSettingsService.setObsSettings(obsSettings);
    this.obsSettings = this.streamSettingsService.getObsSettings();
  }

  render() {
    return (
      <div>
        Stream Settings
        <GenericFormGroups value={this.obsSettings} onInput={this.saveObsSettings} />
      </div>
    );
  }
}
