import {
  Module,
  apiMethod,
  apiEvent,
  EApiPermissions,
  IApiContext
} from './module';
import { Inject } from 'util/injector';
import { Subject } from 'rxjs/Subject';
import {
  INotificationsServiceApi,
  INotification,
  INotificationOptions,
  INotificationsSettings,
  ENotificationType
} from 'services/notifications';
import { TObsFormData } from 'components/obs/inputs/ObsInput';

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
  getSettingsFormData(): TObsFormData {
    return this.notificationsService.getSettingsFormData()
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
