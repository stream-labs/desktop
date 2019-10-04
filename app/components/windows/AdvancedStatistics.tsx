import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import { WindowsService } from 'services/windows';
import styles from './AdvancedStatistics.m.less';
import ModalLayout from 'components/ModalLayout.vue';
// import Notifications from './notifications.vue';
import PerformanceMetrics from './../PerformanceMetrics.vue';
import GlobalSyncStatus from 'components/GlobalSyncStatus.vue';
import moment from 'moment';
import { ENotificationType, NotificationsService, INotification } from 'services/notifications';

@Component({})
export default class AdvancedStatistics extends TsxComponent<{}> {
  @Inject() windowsService: WindowsService;
  @Inject() notificationsService: NotificationsService;

  private updateInterval = 0;
  private notifications: INotification[] = [];

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
    this.notifications.push(notification);
  }

  render(h: Function) {
    return (
      <ModalLayout showControls={false}>
        <div slot="content" class={styles.container}>
          <div>
            <h2>Status</h2>
            <span class="fa fa-info-circle" />
            <span class="fa fa-exclamation-triangle" />
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
            {this.notifications.map(notification => (
              <div class={styles.notification}>
                <div class="icon">
                  {notification.type === 'INFO' && <span class="fa fa-info-circle" />}
                  {notification.type === 'WARNING' && <span class="fa fa-exclamation-triangle" />}
                </div>
                <div class="message">{notification.message}</div>
                <div class="date">{this.moment(notification.date)}</div>
              </div>
            ))}
          </div>
        </div>
      </ModalLayout>
    );
  }
}
