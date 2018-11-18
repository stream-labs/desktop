import { Service } from './service';
import { Inject } from '../util/injector';
import { UserService } from './user';
import { HostsService } from './hosts';
import fs from 'fs';
import path from 'path';
import electron from 'electron';
import { authorizedHeaders, handleErrors } from 'util/requests';
import { Debounce } from 'lodash-decorators';

export type TUsageEvent =
  'stream_start' |
  'stream_end' |
  'app_start' |
  'app_close' |
  'crash';

interface IUsageApiData {
  installer_id?: string;
  version: string;
  slobs_user_id: string;
  event: TUsageEvent;
  data: string;
}

type TAnalyticsEvent = 'TCP_API_REQUEST'; // add more types if you need

interface IAnalyticsEvent {
  product: string;
  version: number;
  event: string;
  value?: any;
  time?: string;
  count?: number;
  uuid?: string;
  saveUser?: boolean;
}

export function track(event: TUsageEvent) {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {

    return {
      ...descriptor,
      value(...args: any[]): any {
        UsageStatisticsService.instance.recordEvent(event);
        descriptor.value.apply(this, args);
      }
    };
  };
}


export class UsageStatisticsService extends Service {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;

  installerId: string;
  version = electron.remote.process.env.SLOBS_VERSION;

  private anaiticsEvents: IAnalyticsEvent[] = [];

  init() {
    this.loadInstallerId();
  }

  loadInstallerId() {
    let installerId = localStorage.getItem('installerId');

    if (!installerId) {
      const exePath = electron.remote.app.getPath('exe');
      const installerNamePath = path.join(path.dirname(exePath), 'installername');

      if (fs.existsSync(installerNamePath)) {
        try {
          const installerName = fs.readFileSync(installerNamePath).toString();

          if (installerName) {
            const matches = installerName.match(/\-([A-Za-z0-9]+)\.exe/);
            if (matches) {
              installerId = matches[1];
              localStorage.setItem('installerId', installerId);
            }
          }
        } catch (e) {
          console.error('Error loading installer id', e);
        }
      }
    }

    this.installerId = installerId;
  }

  get isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Record a usage event on our server.
   * @param event the event type to record
   * @param metadata arbitrary data to store with the event (must be serializable)
   */
  recordEvent(event: TUsageEvent, metadata: object = {}) {
    if (!this.isProduction) return;

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const bodyData: IUsageApiData = {
      slobs_user_id: this.userService.getLocalUserId(),
      version: this.version,
      event,
      data: JSON.stringify(metadata)
    };

    if (this.userService.isLoggedIn()) {
      authorizedHeaders(this.userService.apiToken, headers);
    }

    if (this.installerId) {
      bodyData.installer_id = this.installerId;
    }

    const request = new Request(`https://${this.hostsService.streamlabs}/api/v5/slobs/log`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData)
    });

    return fetch(request);
  }

  recordAnalyticsEvent(event: string, value: any) {
    this.anaiticsEvents.push({
      event,
      value,
      product: 'SLOBS',
      version: this.version,
      count: 1
    });
    this.sendAnalytics();
  }

  @Debounce(2 * 60 * 1000)
  private sendAnalytics() {
    const data = { analyticsTokens: [ ...this.anaiticsEvents ] };
    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/json');

    this.anaiticsEvents.length = 0;

    const request = new Request(`https://${this.hostsService.streamlabs}/api/v5/analytics/slobs/ping`, {
      method: 'post',
      headers: authorizedHeaders(this.userService.apiToken),
      body: JSON.stringify(data || {})
    });
    fetch(request).then(handleErrors);
  }
}
