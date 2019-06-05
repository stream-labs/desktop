import { Module, apiMethod, apiEvent, EApiPermissions, IApiContext } from './module';
import { Inject } from 'services/core/injector';
import { Subject } from 'rxjs';
import { INotificationsServiceApi } from 'services/notifications';

type TIssueCode = 'FRAMES_LAGGED' | 'FRAMES_SKIPPED' | 'FRAMES_DROPPED';

enum ENotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
}

interface INotificationOptions {
  message: string;
  code?: TIssueCode | string;
  unread?: boolean;
  type?: ENotificationType;
  playSound?: boolean;
  data?: any;

  /** The notification's life time in ms. Use -1 for infinity */
  lifeTime?: number;
  showTime?: boolean;
}

interface INotification extends INotificationOptions {
  id: number;
  type: ENotificationType;
  message: string;
  unread: boolean;
  date: number;
  playSound: boolean;
  lifeTime: number;
  showTime: boolean;
}

export class NotificationsModule extends Module {
  @Inject() private notificationsService: INotificationsServiceApi;

  constructor() {
    super();

    this.notificationsService.notificationRead.subscribe(ids => {
      this.notificationRead.next(ids);
    });
  }

  moduleName = 'Notifications';
  permissions = [EApiPermissions.Notifications];

  @apiEvent()
  notificationRead = new Subject<number[]>();

  @apiMethod()
  push(ctx: IApiContext, notification: INotificationOptions): INotification {
    return this.notificationsService.push(notification);
  }

  @apiMethod()
  markAsRead(ctx: IApiContext, id: number): void {
    return this.notificationsService.markAsRead(id);
  }
}
