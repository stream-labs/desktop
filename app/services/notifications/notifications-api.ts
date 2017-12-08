import { TPerformanceIssueCode } from 'services/performance-monitor';
import { IJsonRpcRequest } from '../../services-manager';
import { Observable } from 'rxjs/Observable';

export enum ENotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING'
}


export interface INotificationOptions {
  message: string;
  code?: TPerformanceIssueCode | string;
  unread?: boolean;
  type?: ENotificationType;
  action?: IJsonRpcRequest;
}


export interface INotification extends INotificationOptions {
  id: number;
  type: ENotificationType;
  message: string;
  unread: boolean;
  date: number;
}


export interface INotificationsApi {
  notificationPushed: Observable<INotification>;
  push(notifyInfo: INotificationOptions): INotification;
  getNotification(id: number): INotification;
  getAll(type?: ENotificationType): INotification[];
  getUnread(type?: ENotificationType): INotification[];
  getRead(type?: ENotificationType): INotification[];
  markAllAsRead(): void;
  applyAction(notificationId: number): void;
  showNotifications(): void;
}
