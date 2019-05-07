import { Service } from 'services/service';
import { NotificationsService, ENotificationType } from 'services/notifications';
import { Inject } from 'util/injector';
import { JsonrpcService, IJsonRpcRequest } from 'services/api/jsonrpc';
import electron from 'electron';
import { UserService } from 'services/user';
import { TPlatform } from 'services/platforms';

interface IOutageNotification {
  /**
   * Uniquely identifies this message
   */
  id: string;

  /**
   * The body of the message
   */
  message: string;

  /**
   * If set, clicking the notification will
   * open a browser and navigate to this URL.
   */
  url?: string;

  /**
   * This message should be ignored if disabled is true
   */
  disabled: boolean;

  // An array of streaming platforms that this notification is relevent to
  platforms: TPlatform[];
}

// Configuration
const S3_BUCKET = 'streamlabs-obs';
const S3_KEY = 'outage-notification.json';
const POLLING_INTERVAL = 5 * 60 * 1000;

export class OutageNotificationsService extends Service {
  @Inject() notificationsService: NotificationsService;
  @Inject() jsonrpcService: JsonrpcService;
  @Inject() userService: UserService;

  currentMessageId: string = null;
  currentNotificationId: number = null;

  init() {
    this.checkForNotification();
    setInterval(() => this.checkForNotification(), POLLING_INTERVAL);
  }

  private pushNotification(message: string, url?: string) {
    let action: IJsonRpcRequest;

    action = this.jsonrpcService.createRequest(
      Service.getResourceId(this.notificationsService),
      'showNotifications',
    );

    if (url) {
      action = this.jsonrpcService.createRequest(
        Service.getResourceId(this),
        'openBrowserWindow',
        url,
      );
    }

    return this.notificationsService.push({
      action,
      message,
      type: ENotificationType.WARNING,
      lifeTime: -1,
    });
  }

  private openBrowserWindow(url: string) {
    electron.remote.shell.openExternal(url);
  }

  private async checkForNotification() {
    const msg = await this.fetchMessageJson();

    // There are no urgent messages to display to the user
    if (!msg || msg.disabled || !msg.platforms.includes(this.userService.platform.type)) {
      this.clearNotification();
      return;
    }

    // The current version of SLOBS is up to date
    if (msg.id === 'slobs-out-of-date-0.12') return;

    // The current message is still in effect
    if (this.currentMessageId === msg.id) return;

    // There is a new message to display to the user
    const notification = this.pushNotification(msg.message, msg.url);
    this.currentMessageId = msg.id;
    this.currentNotificationId = notification.id;
  }

  private clearNotification() {
    if (this.currentMessageId) this.currentMessageId = null;
    if (this.currentNotificationId) {
      this.notificationsService.markAsRead(this.currentNotificationId);
      this.currentNotificationId = null;
    }
  }

  private async fetchMessageJson(): Promise<IOutageNotification> {
    const req = new Request(this.messageUrl);
    const headers = new Headers();
    headers.append('Pragma', 'no-cache');
    headers.append('Cache-Control', 'no-cache');

    try {
      const response = await fetch(req, { headers });

      if (response.ok) {
        return await response.json();
      }

      return;
    } catch (e) {
      return;
    }
  }

  private get messageUrl() {
    return `https://s3-us-west-2.amazonaws.com/${S3_BUCKET}/${S3_KEY}`;
  }
}
