import { Inject } from '../../util/injector';
import { StatefulService, mutation } from '../stateful-service';
import { Subject } from 'rxjs/Subject';
import { WindowsService } from 'services/windows';
import { ServicesManager } from '../../services-manager';
import {
  ENotificationType,
  INotification,
  INotificationOptions, INotificationsApi
} from './notifications-api';


interface INotificationsState {
  notifications: INotification[];
}


export class NotificationsService extends StatefulService<INotificationsState> implements INotificationsApi {

  static initialState: INotificationsState = {
    notifications: []
  };

  @Inject() private windowsService: WindowsService;
  servicesManager: ServicesManager = ServicesManager.instance;

  notificationPushed = new Subject<INotification>();
  private nextId = 1;


  push(notifyInfo: INotificationOptions): INotification {
    const notify = {
      id: this.nextId++,
      unread: true,
      date: Date.now(),
      type: ENotificationType.INFO,
      ...notifyInfo
    };
    this.PUSH(notify);
    this.notificationPushed.next(notify);
    return notify;
  }

  getNotification(id: number): INotification {
    return this.state.notifications.find(notify => notify.id === id);
  }


  applyAction(notificationId: number) {
    const notify = this.getNotification(notificationId);
    if (!notify || !notify.action) return;

    this.servicesManager.executeServiceRequest(notify.action);
  }


  getAll(type?: ENotificationType): INotification[] {
    return this.state.notifications.filter(notify => {
      return !type || notify.type === type;
    });
  }


  getUnread(type?: ENotificationType): INotification[] {
    return this.getAll(type).filter(notify => notify.unread);
  }


  getRead(type?: ENotificationType): INotification[] {
    return this.getAll(type).filter(notify => !notify.unread);
  }


  markAllAsRead() {
    this.MARK_ALL_AS_READ();
  }


  showNotifications() {
    this.windowsService.showWindow({
      componentName: 'Notifications',
      size: {
        width: 600,
        height: 600
      }
    });
  }


  showTroubleshooter() {
    this.windowsService.showWindow({
      componentName: 'Troubleshooter',
      size: {
        width: 500,
        height: 500
      }
    });
  }


  // TODO comment test methods before release

  testWarning() {
    this.push({
      type: ENotificationType.WARNING,
      message: 'This is warning notification '
    });
  }


  testInfo() {
    this.push({
      type: ENotificationType.INFO,
      message: 'This is info notification'
    });
  }


  @mutation()
  private PUSH(notify: INotification) {
    this.state.notifications.unshift(notify);
  }


  @mutation()
  private MARK_ALL_AS_READ() {
    this.state.notifications.forEach(notify => notify.unread = false);
  }
}
