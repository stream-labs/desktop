import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import GenericForm from './shared/forms/GenericForm.vue';
import { INotificationsServiceApi, INotificationsSettings } from 'services/notifications';
import { TFormData } from './shared/forms/Input';
import { ITroubleshooterServiceApi, ITroubleshooterSettings } from 'services/troubleshooter';

@Component({
  components: { GenericForm }
})
export default class NotificationsSettings extends Vue {

  @Inject() notificationsService: INotificationsServiceApi;
  @Inject() troubleshooterService: ITroubleshooterServiceApi;

  settingsFormData: TFormData = null;
  troubleshooterFormData: TFormData = null;


  created() {
    this.updateForms();
  }


  saveNotificationsSettings(formData: TFormData) {
    const settings: Partial<INotificationsSettings> = {};
    formData.forEach(formInput => {
      settings[formInput.name] = formInput.value;
    });
    this.notificationsService.setSettings(settings);
    this.settingsFormData = this.notificationsService.getSettingsFormData();
  }


  saveTroubleshooterSettings(formData: TFormData) {
    const settings: Partial<ITroubleshooterSettings> = {};
    formData.forEach(formInput => {
      settings[formInput.name] = formInput.value;
    });
    this.troubleshooterService.setSettings(settings);
    this.troubleshooterFormData = this.troubleshooterService.getSettingsFormData();
  }


  restoreDefaults() {
    this.notificationsService.restoreDefaultSettings();
    this.troubleshooterService.restoreDefaultSettings();
    this.updateForms();
  }


  showNotifications() {
    this.notificationsService.showNotifications();
  }

  private updateForms() {
    this.settingsFormData = this.notificationsService.getSettingsFormData();
    this.troubleshooterFormData = this.troubleshooterService.getSettingsFormData();
  }
}
