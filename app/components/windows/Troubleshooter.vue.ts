import Vue from 'vue';
import moment from 'moment';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import windowMixin from '../mixins/window';
import { TPerformanceIssueCode } from 'services/performance-monitor';
import { INotificationsApi, INotification } from 'services/notifications';
import { ISettingsServiceApi } from 'services/settings';


@Component({
  components: { ModalLayout },
  mixins: [windowMixin]
})
export default class Troubleshooter extends Vue {

  @Inject() private notificationsService: INotificationsApi;
  @Inject() private settingsService: ISettingsServiceApi;

  get issues(): INotification[] {
    // get last issues based on notifications
    const issues: INotification[] = [];
    const issuesCodes: TPerformanceIssueCode[] = ['FRAMES_SKIPPED', 'FRAMES_LAGGED'];
    const notifications = this.notificationsService.getAll();
    issuesCodes.forEach(issueCode => {
      const issue = notifications.find(notify => notify.code === issueCode);
      if (issue) issues.push(issue);
    });

    return issues;
  }

  showSettings() {
    this.settingsService.showSettings();
  }


  moment(time: number): string {
    return moment(time).fromNow();
  }
}
