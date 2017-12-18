import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import GenericForm from './shared/forms/GenericForm.vue';
import { INotificationsServiceApi, INotificationsSettings } from 'services/notifications';
import { TFormData } from './shared/forms/Input';

@Component({
  components: { GenericForm }
})
export default class NotificationsSettings extends Vue {

  @Inject() notificationsService: INotificationsServiceApi;

  settingsFormData: TFormData = null;


  created() {
    this.settingsFormData = this.notificationsService.getSettingsFormData();
  }


  save(formData: TFormData) {
    const settings: Partial<INotificationsSettings> = {};
    formData.forEach(formInput => {
      settings[formInput.name] = formInput.value;
    });
    this.notificationsService.setSettings(settings);
    this.settingsFormData = this.notificationsService.getSettingsFormData();
  }


  showNotifications() {
    this.notificationsService.showNotifications();
  }
}
