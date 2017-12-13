import { Inject } from '../../util/injector';
import { mutation } from '../stateful-service';
import { PersistentStatefulService } from 'services/persistent-stateful-service';
import { Subject } from 'rxjs/Subject';
import { WindowsService } from 'services/windows';
import { ServicesManager } from '../../services-manager';
import { TIssueCode } from 'services/performance-monitor';
import { IFormInput, TFormData } from '../../components/shared/forms/Input';
import {
  ENotificationType,
  INotification,
  INotificationOptions,
  INotificationsApi,
  INotificationsSettings
} from './notifications-api';


interface INotificationsState {
  settings: INotificationsSettings;
  notifications: INotification[];
}


export class NotificationsService extends PersistentStatefulService<INotificationsState> implements INotificationsApi {

  static defaultState: INotificationsState = {
    notifications: [],
    settings: {
      enabled: true,
      playSound: true
    }
  };

  @Inject() private windowsService: WindowsService;
  servicesManager: ServicesManager = ServicesManager.instance;

  notificationPushed = new Subject<INotification>();
  private nextId = 1;


  init() {
    super.init();
    this.CLEAR();
  }


  push(notifyInfo: INotificationOptions): INotification {
    const notify = {
      id: this.nextId++,
      unread: true,
      date: Date.now(),
      type: ENotificationType.INFO,
      playSound: true,
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


  getSettings(): INotificationsSettings {
    return this.state.settings;
  }


  getSettingsFormData(): TFormData {
    const settings = this.state.settings;
    return [
      <IFormInput<boolean>> {
        value: settings.enabled,
        name: 'enabled',
        description: 'Enable notifications',
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <IFormInput<boolean>> {
        value: settings.playSound,
        name: 'playSound',
        description: 'Enable sound',
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: settings.enabled
      }
    ];
  }


  setSettings(patch: Partial<INotificationsSettings>) {
    this.SET_SETTINGS(patch);
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


  showTroubleshooter(issueCode: TIssueCode) {
    this.windowsService.showWindow({
      componentName: 'Troubleshooter',
      queryParams: { issueCode },
      size: {
        width: 500,
        height: 500
      }
    });
  }


  @mutation()
  private SET_SETTINGS(patch: Partial<INotificationsSettings>) {
    this.state.settings = { ...this.state.settings, ...patch };
  }



  @mutation()
  private PUSH(notify: INotification) {
    this.state.notifications.unshift(notify);
  }


  @mutation()
  private CLEAR() {
    this.state.notifications.length = 0;
  }


  @mutation()
  private MARK_ALL_AS_READ() {
    this.state.notifications.forEach(notify => notify.unread = false);
  }
}
