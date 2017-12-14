import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import {
  ENotificationType,
  NotificationsService,
  INotification
} from 'services/notifications';

const LIFE_TIME = 15000;

interface IUiNotification extends INotification {
  outdated?: boolean;
}

@Component({})
export default class NotificationsArea extends Vue {

  @Inject() private notificationsService: NotificationsService;

  notifications: IUiNotification[] = [];
  notifyAudio: HTMLAudioElement;


  mounted() {
    this.notifyAudio = new Audio('media/sound/ding.wav');
    this.notificationsService.notificationPushed.subscribe(notify => {
      this.onNotificationHandler(notify);
    });
  }


  get unreadCount() {
    return this.notificationsService
      .getUnread(ENotificationType.WARNING)
      .length;
  }

  get settings() {
    return this.notificationsService.state.settings;
  }


  onNotificationHandler(notify: INotification) {

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
        window.setTimeout(() => this.hideOutdated(), LIFE_TIME);
      });
    });
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
      if (Date.now() - notify.date < LIFE_TIME) return;
      notify.outdated = true;
    });
  }
}
