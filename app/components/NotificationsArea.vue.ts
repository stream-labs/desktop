import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import {
  ENotificationType,
  NotificationsService,
  INotification
} from 'services/notifications';

const QUEUE_TIME = 5000;

interface IUiNotification extends INotification {
  outdated?: boolean;
}

@Component({})
export default class NotificationsArea extends Vue {
  @Inject() private notificationsService: NotificationsService;

  notifications: IUiNotification[] = [];
  private notificationQueue: INotification[] = [];
  private notifyAudio: HTMLAudioElement;
  private checkQueueIntervalId: number = null;
  private canShowNextNotify = true;

  mounted() {
    this.notifyAudio = new Audio('media/sound/ding.wav');
    this.notificationsService.notificationPushed.subscribe(notify => {
      this.onNotificationHandler(notify);
    });
    this.checkQueueIntervalId = window.setInterval(
      () => this.checkQueue(),
      QUEUE_TIME
    );
  }

  destroyed() {
    clearInterval(this.checkQueueIntervalId);
  }

  get unreadCount() {
    return this.notificationsService.getUnread(ENotificationType.WARNING)
      .length;
  }

  get settings() {
    return this.notificationsService.state.settings;
  }

  private checkQueue() {
    if (this.notificationQueue.length === 0) {
      this.canShowNextNotify = true;
      return;
    }
    const notify = this.notificationQueue.shift();
    this.showNotification(notify);
    this.canShowNextNotify = false;
  }

  private showNotification(notify: INotification) {
    if (!this.settings.enabled) return;

    if (notify.playSound && this.settings.playSound) {
      this.notifyAudio.play();
    }

    this.notifications = this.notifications.filter(notify => {
      return !notify.outdated;
    });

    // setup order of appearing elements via nextTick to have a correct animation
    Vue.nextTick(() => {
      if (this.notifications[0]) {
        this.notifications[0].outdated = true;
      }
      Vue.nextTick(() => {
        this.notifications.push({ ...notify, outdated: false });
        if (notify.lifeTime !== -1)
          window.setTimeout(() => this.hideOutdated(), notify.lifeTime);
      });
    });
  }

  private onNotificationHandler(notify: INotification) {
    this.notificationQueue.push(notify);
    if (this.canShowNextNotify) this.checkQueue();
  }

  showNotifications() {
    this.notificationsService.showNotifications();
  }

  onNotificationClickHandler(id: number) {
    const notify = this.notifications.find(notify => notify.id === id);
    if (notify.outdated) return;
    this.notificationsService.applyAction(id);
  }

  private hideOutdated() {
    this.notifications.forEach(notify => {
      if (notify.lifeTime === -1) return;
      if (Date.now() - notify.date < notify.lifeTime) return;
      notify.outdated = true;
    });
  }
}
