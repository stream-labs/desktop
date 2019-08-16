import { HostsService } from 'services/hosts';
import { StatefulService, Inject, mutation } from 'services/core';
import { UserService } from 'services/user';
import { authorizedHeaders, handleResponse } from '../util/requests';

interface IRecentEvent {
  id: number;
  name: string;
  display_name?: string;
  from: string;
  from_display_name?: string;
  amount?: string;
  created_at: string;
}

interface IRecentEventsState {
  recentEvents: IRecentEvent[];
}

export class RecentEventsService extends StatefulService<IRecentEventsState> {
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;

  static initialState: IRecentEventsState = { recentEvents: null };

  init() {
    super.init();
    this.formEventsArray();
  }

  fetchRecentEvents() {
    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/recentevents/${
      this.userService.widgetToken
    }`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });
    return fetch(request)
      .then(handleResponse)
      .catch(() => null);
  }

  async formEventsArray() {
    const events = await this.fetchRecentEvents();
    let eventArray: IRecentEvent[] = [];
    Object.keys(events.data).forEach(key => {
      eventArray = eventArray.concat(events.data[key]);
    });

    eventArray.sort((a: IRecentEvent, b: IRecentEvent) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    this.SET_RECENT_EVENTS(eventArray);
  }

  @mutation()
  SET_RECENT_EVENTS(eventArray: IRecentEvent[]) {
    this.state.recentEvents = eventArray;
  }
}
