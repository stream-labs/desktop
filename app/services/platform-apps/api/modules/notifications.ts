import {
  Module,
  apiMethod,
  apiEvent,
  EApiPermissions,
  IApiContext
} from './module';
import { Inject } from 'util/injector';
import { Subject } from 'rxjs/Subject';
import { INotificationsServiceApi } from 'services/notifications';

type TIssueCode = 'FRAMES_LAGGED' | 'FRAMES_SKIPPED' | 'FRAMES_DROPPED';

interface IJsonRpcRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params: {
    resource: string,
    args?: any[],
    fetchMutations?: boolean,
    compactMode?: boolean
  };
}

enum ENotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS'
}

interface INotificationsSettings {
  enabled: boolean;
  playSound: boolean;
}

interface INotificationOptions {
  message: string;
  code?: TIssueCode | string;
  unread?: boolean;
  type?: ENotificationType;
  action?: IJsonRpcRequest;
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

    this.notificationsService.notificationPushed.subscribe(notification => {
      this.notificationPushed.next(notification);
    });

    this.notificationsService.notificationRead.subscribe(ids => {
      this.notificationRead.next(ids);
    });
  }

  moduleName = 'Notifications';
  permissions = [EApiPermissions.Notifications];

  @apiEvent()
  notificationPushed = new Subject<INotification>();

  @apiEvent()
  notificationRead = new Subject<number[]>();

  @apiMethod()
  push(ctx: IApiContext, notification: INotificationOptions): INotification {
    return this.notificationsService.push(notification);
  }

  @apiMethod()
  getNotification(ctx: IApiContext, id: number): INotification {
    return this.notificationsService.getNotification(id);
  }

  @apiMethod()
  getAll(ctx: IApiContext, type?: ENotificationType): INotification[] {
    return this.notificationsService.getAll(type);
  }

  @apiMethod()
  getUnread(ctx: IApiContext, type?: ENotificationType): INotification[] {
    return this.notificationsService.getUnread(type);
  }

  @apiMethod()
  getRead(ctx: IApiContext, type?: ENotificationType): INotification[] {
    return this.notificationsService.getRead(type);
  }

  @apiMethod()
  getSettings(): INotificationsSettings {
    return this.notificationsService.getSettings();
  }

  @apiMethod()
  setSettings(ctx: IApiContext, patch: Partial<INotificationsSettings>): void {
    return this.notificationsService.setSettings(patch);
  }

  @apiMethod()
  restoreDefaultSettings(): void {
    return this.notificationsService.restoreDefaultSettings();
  }

  @apiMethod()
  markAsRead(ctx: IApiContext, id: number): void {
    return this.notificationsService.markAsRead(id);
  }

  @apiMethod()
  markAllAsRead(): void {
    return this.notificationsService.markAllAsRead();
  }

  @apiMethod()
  applyAction(ctx: IApiContext, notificationId: number): void {
    return this.notificationsService.applyAction(notificationId);
  }

  @apiMethod()
  showNotifications(): void {
    return this.notificationsService.showNotifications();
  }
}
