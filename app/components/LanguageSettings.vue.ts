import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { $t, I18nServiceApi } from 'services/i18n';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import electron from 'electron';

@Component({
  components: { GenericForm }
})
export default class LanguageSettings extends Vue {
  @Inject() private i18nService: I18nServiceApi;

  settings = this.i18nService.getLocaleFormData();

  private async save(data: TObsFormData) {
    const choice = electron.remote.dialog.showMessageBox(
      electron.remote.getCurrentWindow(),
      {
        type: 'question',
        buttons: [$t('Yes'), $t('No')],
        title: $t('Confirm'),
        message: $t('This action will restart the application. Continue?')
      });

    if (choice !== 0) return;

    await this.i18nService.setLocale(data[0].value as string);
    this.settings = this.i18nService.getLocaleFormData();
  }

}
