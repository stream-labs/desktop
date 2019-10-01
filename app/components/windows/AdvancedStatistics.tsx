import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import { WindowsService } from 'services/windows';
import styles from './AdvancedStatistics.m.less';
import ModalLayout from 'components/ModalLayout.vue';
import Notifications from './notifications.vue';
import PerformanceMetrics from './../PerformanceMetrics.vue';
import GlobalSyncStatus from 'components/GlobalSyncStatus.vue';
import moment from 'moment';
import { ENotificationType, NotificationsService, INotification } from 'services/notifications';

@Component({})
export default class AdvancedStatistics extends TsxComponent<{}> {
  @Inject() windowsService: WindowsService;
  @Inject() notificationsService: NotificationsService;

  private updateInterval = 0;

  mounted() {
    this.notificationsService.notificationPushed.subscribe(notify => {
      this.onNotificationHandler(notify);
    });
    // update the time labels
    this.updateInterval = window.setInterval(() => {
      this.$forceUpdate();
    }, 60 * 1000);
  }

  destroyed() {
    this.notificationsService.markAllAsRead();
    clearInterval(this.updateInterval);
  }

  get notificationGroups(): { unread: INotification[]; read: INotification[] } {
    return {
      unread: this.notificationsService.getUnread(),
      read: this.notificationsService.getRead(),
    };
  }

  get notificationsCount() {
    return this.notificationsService.getAll().length;
  }

  onNotificationClickHandler(id: number) {
    this.notificationsService.applyAction(id);
  }

  moment(time: number): string {
    return moment(time).fromNow();
  }

  onNotificationHandler(notification: INotification) {
    console.log(notification);
  }

  render(h: Function) {
    return (
      <ModalLayout showControls={false}>
        <div slot="content" class={styles.container}>
          <div>
            <h2>Status</h2>
          </div>
          <div>
            <h2>Live Stats</h2>
            <div class={styles.statsRow}>
              <PerformanceMetrics />
              <GlobalSyncStatus />
            </div>
          </div>
          <div>
            <h2>Performance Notifications</h2>
            <Notifications />
          </div>
        </div>
      </ModalLayout>
    );
  }
}
