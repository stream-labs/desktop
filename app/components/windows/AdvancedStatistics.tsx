import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import cx from 'classnames';
import styles from './AdvancedStatistics.m.less';
import ModalLayout from 'components/ModalLayout.vue';
import PerformanceMetrics from './../PerformanceMetrics.vue';
import { StreamingService, EStreamingState } from 'services/streaming';
import GlobalSyncStatus from 'components/GlobalSyncStatus.vue';
import moment from 'moment';
import { Subscription } from 'rxjs';
import { PerformanceService, EStreamQuality } from 'services/performance';
import {
  ENotificationType,
  ENotificationSubType,
  NotificationsService,
  INotification,
} from 'services/notifications';

@Component({})
export default class AdvancedStatistics extends TsxComponent<{}> {
  @Inject() notificationsService: NotificationsService;
  @Inject() performanceService: PerformanceService;
  @Inject() streamingService: StreamingService;

  private updateInterval = 0;
  private notifications: INotification[] = [];
  private notificationPushed: Subscription = null;

  mounted() {
    this.notificationPushed = this.notificationsService.notificationPushed.subscribe(notify => {
      this.onNotificationHandler(notify);
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
    clearInterval(this.updateInterval);
  }

  get streamQuality() {
    return this.performanceService.streamQuality;
  }

  get streamingStatus() {
    return this.streamingService.state.streamingStatus;
  }

  get status(): { type: string; description: string } {
    if (this.streamingStatus === EStreamingState.Offline) {
      return {
        type: 'info',
        description: $t('Your stream is currently offline'),
      };
    }

    if (
      this.streamingStatus === EStreamingState.Reconnecting ||
      this.streamQuality === EStreamQuality.POOR
    ) {
      return {
        type: 'error',
        description: $t('Your stream is experiencing issues'),
      };
    }

    if (this.streamQuality === EStreamQuality.FAIR) {
      return {
        type: 'warning',
        description: $t('Your stream is experiencing minor issues'),
      };
    }

    return {
      type: 'success',
      description: $t('Your stream quality is good'),
    };
  }

  moment(time: number): string {
    return moment(time).fromNow();
  }

  onNotificationHandler(notification: INotification) {
    if (notification.subType === ENotificationSubType.DEFAULT) {
      return;
    }
    this.notifications.unshift(notification);
  }

  onNotificationClickHandler(id: number) {
    this.notificationsService.applyAction(id);
  }

  get statusIcon() {
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

  get statusBar() {
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
          {this.statusIcon}
          <span>{this.status.description}</span>
        </div>
      </div>
    );
  }

  notificationsArea() {
    return (
      <div class={styles.section}>
        <h2>Performance Notifications</h2>
        <div class={styles.notificationContainer}>
          {this.notifications.map(notification => (
            <div
              class={cx(styles.notification, styles.hasAction)}
              onClick={() => {
                this.onNotificationClickHandler(notification.id);
              }}
            >
              {this.iconForNotificationBySubType(notification)}
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

  iconForNotificationBySubType(notification: INotification) {
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

  render() {
    return (
      <ModalLayout showControls={false}>
        <div slot="content" class={styles.container}>
          {this.statusBar}
          <div>
            <h2>{$t('Live Stats')}</h2>
            <p>{$t('Click on a stat to add it to your footer')}</p>
            <div class={styles.statsRow}>
              <PerformanceMetrics mode="full" />
              <GlobalSyncStatus />
            </div>
          </div>
          {this.notificationsArea()}
        </div>
      </ModalLayout>
    );
  }
}
