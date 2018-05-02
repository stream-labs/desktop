import Vue from 'vue';
import electron from 'electron';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { I18nServiceApi } from 'services/i18n';
import GenericForm from 'components/shared/forms/GenericForm.vue';
import { TFormData } from './shared/forms/Input';

@Component({
  components: { GenericForm }
})
export default class LanguageSettings extends Vue {
  @Inject() private i18nService: I18nServiceApi;

  settings = this.i18nService.getLocaleFormData();

  private async save(data: TFormData) {
    await this.i18nService.setLocale(data[0].value as string);
    this.settings = this.i18nService.getLocaleFormData();
  }

  private restartApp() {
    electron.remote.app.relaunch();
    electron.remote.app.quit();
  }


}
