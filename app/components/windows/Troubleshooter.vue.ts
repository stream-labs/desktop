import Vue from 'vue';
import moment from 'moment';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import windowMixin from '../mixins/window';
import { TIssueCode } from 'services/performance-monitor';
import { INotificationsApi, INotification } from 'services/notifications';
import { ISettingsServiceApi } from 'services/settings';
import { WindowsService } from 'services/windows';


@Component({
  components: { ModalLayout },
  mixins: [windowMixin]
})
export default class Troubleshooter extends Vue {

  @Inject() private notificationsService: INotificationsApi;
  @Inject() private settingsService: ISettingsServiceApi;
  @Inject() private windowsService: WindowsService;

  issueCode = this.windowsService.getChildWindowQueryParams().issueCode as TIssueCode;


  get issue(): INotification {
    return this.notificationsService.getAll().find(notify => notify.code === this.issueCode);
  }


  showSettings() {
    this.settingsService.showSettings();
  }


  moment(time: number): string {
    return moment(time).fromNow();
  }
}
