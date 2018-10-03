import { Module, apiMethod, apiEvent, EApiPermissions } from './module';
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

  moduleName = 'Notifications';
  permissions = [EApiPermissions.Notifications];

  @apiEvent()
  sceneAdded = new Subject<INotification>();

  @apiEvent()
  sceneSwitched = new Subject<number[]>();

  @apiMethod()
  push(notification: INotificationOptions): INotification {
    return this.notificationsService.push(notification);
  }

  @apiMethod()
  getNotification(id: number): INotification {
    return this.notificationsService.getNotification(id);
  }

  @apiMethod()
  getAll(type?: ENotificationType): INotification[] {
    return this.notificationsService.getAll(type);
  }

  @apiMethod()
  getUnread(type?: ENotificationType): INotification[] {
    return this.notificationsService.getUnread(type);
  }

  @apiMethod()
  getRead(type?: ENotificationType): INotification[] {
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
  setSettings(patch: Partial<INotificationsSettings>): void {
    return this.notificationsService.setSettings(patch);
  }

  @apiMethod()
  restoreDefaultSettings(): void {
    return this.notificationsService.restoreDefaultSettings();
  }

  @apiMethod()
  markAsRead(id: number): void {
    return this.notificationsService.markAsRead(id);
  }

  @apiMethod()
  markAllAsRead(): void {
    return this.notificationsService.markAllAsRead();
  }

  @apiMethod()
  applyAction(notificationId: number): void {
    return this.notificationsService.applyAction(notificationId);
  }

  @apiMethod()
  showNotifications(): void {
    return this.notificationsService.showNotifications();
  }
}
