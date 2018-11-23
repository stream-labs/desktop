import { Service } from 'services/service';
import { NotificationsService, ENotificationType } from 'services/notifications';
import { Inject } from 'util/injector';
import { JsonrpcService, IJsonRpcRequest } from 'services/jsonrpc';
import electron from 'electron';

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
}

// Configuration
const S3_BUCKET = 'streamlabs-obs';
const S3_KEY = 'outage-notification.json';
const POLLING_INTERVAL = 5 * 60 * 1000;

export class OutageNotificationsService extends Service {
  @Inject() notificationsService: NotificationsService;
  @Inject() jsonrpcService: JsonrpcService;

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
      message,
      type: ENotificationType.WARNING,
      lifeTime: -1,
      action,
    });
  }

  private openBrowserWindow(url: string) {
    electron.remote.shell.openExternal(url);
  }

  private async checkForNotification() {
    const msg = await this.fetchMessageJson();

    // There are no urgent messages to display to the user
    if (!msg || msg.disabled) {
      this.clearNotification();
      return;
    }

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
