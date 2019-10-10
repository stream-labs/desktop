import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import { WindowsService } from 'services/windows';
import cx from 'classnames';
import styles from './AdvancedStatistics.m.less';
import ModalLayout from 'components/ModalLayout.vue';
import PerformanceMetrics from './../PerformanceMetrics.vue';
import { StreamingService, EStreamingState } from 'services/streaming';
import GlobalSyncStatus from 'components/GlobalSyncStatus.vue';
import moment from 'moment';
import { Subscription } from 'rxjs';
import { PerformanceService } from 'services/performance';
import {
  ENotificationType,
  ENotificationSubType,
  NotificationsService,
  INotification,
} from 'services/notifications';

@Component({})
export default class AdvancedStatistics extends TsxComponent<{}> {
  @Inject() windowsService: WindowsService;
  @Inject() notificationsService: NotificationsService;
  @Inject() performanceService: PerformanceService;
  @Inject() streamingService: StreamingService;

  private updateInterval = 0;
  private notifications: INotification[] = [];
  private streamingStatus = '';
  private notificationPushed: Subscription = null;
  private streamingStatusChange: Subscription = null;

  mounted() {
    this.notificationPushed = this.notificationsService.notificationPushed.subscribe(notify => {
      this.onNotificationHandler(notify);
    });

    this.streamingStatusChange = this.streamingService.streamingStatusChange.subscribe(status => {
      this.onStreamingStatusChange(status);
    });

    this.notifications = this.notificationsService
      .getAll()
      .filter(notification => notification.subType !== ENotificationSubType.DEFAULT);
    // update the time labels
    this.updateInterval = window.setInterval(() => {
      this.$forceUpdate();
    }, 60 * 1000);
  }

  destroyed() {
    this.notificationsService.markAllAsRead();
    this.notificationPushed.unsubscribe();
    this.streamingStatusChange.unsubscribe();
    clearInterval(this.updateInterval);
  }

  get notificationsCount() {
    return this.notificationsService.getAll().length;
  }

  get percentDropped() {
    return this.performanceService.state.percentageDroppedFrames || 0;
  }

  get percentLagged() {
    return this.performanceService.state.percentageLaggedFrames || 0;
  }

  get percentSkipped() {
    return this.performanceService.state.percentageSkippedFrames || 0;
  }

  get status(): { type: string; description: string } {
    if (
      this.streamingStatus === 'reconnecting' ||
      this.percentDropped > 50 ||
      this.percentLagged > 50 ||
      this.percentSkipped > 50
    ) {
      return {
        type: 'error',
        description: $t('Streamlabs OBS is experiencing difficulties broadcasting'),
      };
    }

    if (this.percentDropped > 30 || this.percentLagged > 30 || this.percentSkipped > 30) {
      return {
        type: 'warning',
        description: $t('Streamlabs OBS is experiencing minor issues.'),
      };
    }

    return {
      type: 'success',
      description: $t('Streamlabs OBS is running normally'),
    };
  }

  onNotificationClickHandler(id: number) {
    this.notificationsService.applyAction(id);
  }

  onStreamingStatusChange(status: EStreamingState) {
    this.streamingStatus = status;
  }

  moment(time: number): string {
    return moment(time).fromNow();
  }

  onNotificationHandler(notification: INotification) {
    if (notification.subType === ENotificationSubType.DEFAULT) {
      return;
    }
    this.notifications.push(notification);
  }

  statusIcon(h: Function) {
    if (this.status.type === 'error') {
      return <span class="fa fa-minus-circle" />;
    }

    if (this.status.type === 'warning') {
      return <span class="fa fa-exclamation-triangle" />;
    }

    if (this.status.type === 'success') {
      return <span class="fa fa-check" />;
    }
  }

  statusBar(h: Function) {
    return (
      <div>
        <h2>Status</h2>
        <div
          class={cx(
            styles.status,
            this.status.type === 'error' ? styles.error : '',
            this.status.type === 'warning' ? styles.warning : '',
            this.status.type === 'success' ? styles.success : '',
          )}
        >
          {this.statusIcon(h)}
          <span>{this.status.description}</span>
        </div>
      </div>
    );
  }

  notificationsArea(h: Function) {
    return (
      <div class={styles.section}>
        <h2>Performance Notifications</h2>
        <div class={styles.notificationContainer}>
          {this.notifications.map(notification => (
            <div class={styles.notification}>
              {this.iconForNotificationBySubType(h, notification)}
              <div class="message">{notification.message}</div>
              <div class="date">{this.moment(notification.date)}</div>
            </div>
          ))}
          {this.notifications.length === 0 && (
            <div class={styles.notificationEmpty}>
              <div class="message">{$t('You do not have any notifications')}</div>
            </div>
          )}
        </div>
        <p class={styles.description}>
          {$t(
            'When Streamlabs OBS detects performance issues with your stream, such as dropped frames, lagged frames, or a stream disconnection, troubleshooting notifications will be sent to you here.',
          )}
        </p>
      </div>
    );
  }

  iconForNotificationBySubType(h: Function, notification: INotification) {
    return (
      <div class="icon">
        {notification.subType === ENotificationSubType.DISCONNECTED && (
          <i class={cx('icon-disconnected', styles.errorText)} />
        )}
        {notification.subType === ENotificationSubType.SKIPPED && (
          <i class={cx('icon-reset icon-skipped-frame', styles.warningText)} />
        )}
        {notification.subType === ENotificationSubType.LAGGED && (
          <i class={cx('icon-time', styles.warningText)} />
        )}
        {notification.subType === ENotificationSubType.DROPPED && (
          <i class={cx('icon-back-alt icon-down-arrow', styles.warningText)} />
        )}
      </div>
    );
  }

  render(h: Function) {
    return (
      <ModalLayout showControls={false}>
        <div slot="content" class={styles.container}>
          {this.statusBar(h)}
          <div>
            <h2>Live Stats</h2>
            <div class={styles.statsRow}>
              <PerformanceMetrics />
              <GlobalSyncStatus />
            </div>
          </div>
          {this.notificationsArea(h)}
        </div>
      </ModalLayout>
    );
  }
}
