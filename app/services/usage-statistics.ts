import { Inject } from '../util/injector';
import { UserService } from './user';
import { HostsService } from './hosts';
import fs from 'fs';
import path from 'path';
import electron from 'electron';
import { authorizedHeaders, handleResponse } from 'util/requests';
import { Throttle } from 'lodash-decorators';
import { PersistentStatefulService } from './persistent-stateful-service';
import uuid from 'uuid/v4';
import { mutation } from './stateful-service';

export type TUsageEvent = 'stream_start' | 'stream_end' | 'app_start' | 'app_close' | 'crash';

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
      },
    };
  };
}

interface IUsageStatisticsServiceState {
  uuid: string;
}

export class UsageStatisticsService extends PersistentStatefulService<
  IUsageStatisticsServiceState
> {
  static defaultState: IUsageStatisticsServiceState = {
    uuid: '',
  };

  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;

  installerId: string;
  version = electron.remote.process.env.SLOBS_VERSION;

  private anaiticsEvents: IAnalyticsEvent[] = [];

  init() {
    if (!this.state.uuid) this.SET_UUID();
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

    let headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const bodyData: IUsageApiData = {
      event,
      slobs_user_id: this.userService.getLocalUserId(),
      version: this.version,
      data: JSON.stringify(metadata),
    };

    if (this.userService.isLoggedIn()) {
      headers = authorizedHeaders(this.userService.apiToken, headers);
    }

    if (this.installerId) {
      bodyData.installer_id = this.installerId;
    }

    const request = new Request(`https://${this.hostsService.streamlabs}/api/v5/slobs/log`, {
      headers,
      method: 'POST',
      body: JSON.stringify(bodyData),
    });

    return fetch(request);
  }

  recordAnalyticsEvent(event: TAnalyticsEvent, value: any) {
    this.anaiticsEvents.push({
      event,
      value,
      product: 'SLOBS',
      version: this.version,
      count: 1,
      uuid: this.userService.state.auth ? this.userService.state.auth.platform.id : this.state.uuid,
    });
    this.sendAnalytics();
  }

  @Throttle(2 * 60 * 1000)
  private sendAnalytics() {
    const data = { analyticsTokens: [...this.anaiticsEvents] };
    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/json');

    this.anaiticsEvents.length = 0;

    const request = new Request(`https://${this.hostsService.analitycs}/slobs/data/ping`, {
      headers,
      method: 'post',
      body: JSON.stringify(data || {}),
    });
    fetch(request).then(handleResponse);
  }

  @mutation()
  private SET_UUID() {
    this.state.uuid = uuid();
  }
}
