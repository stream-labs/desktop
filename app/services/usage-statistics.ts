import { Service } from './service';
import { Inject } from '../util/injector';
import { UserService } from './user';
import { HostsService } from './hosts';

export type TUsageEvent =
  'stream_start' |
  'stream_end' |
  'app_start' |
  'app_close';

interface IUsageApiData {
  token?: string;
  slobs_user_id: string;
  event: TUsageEvent;
  data: object;
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

  @Inject()
  userService: UserService;

  @Inject()
  hostsService: HostsService;

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
      event,
      data: metadata
    };

    if (this.userService.isLoggedIn()) {
      bodyData.token = this.userService.widgetToken;
    }

    const request = new Request(`https://${this.hostsService.streamlabs}/api/v5/slobs/log`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData)
    });

    return fetch(request);
  }

}
