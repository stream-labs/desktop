import { HostsService } from 'services/hosts';
import { StatefulService, Inject, mutation } from 'services/core';
import { UserService, LoginLifecycle } from 'services/user';
import { authorizedHeaders, handleResponse } from 'util/requests';
import { $t } from 'services/i18n';
import { WindowsService } from 'services/windows';

export interface IRecentEvent {
  id: number;
  name: string;
  from: string;
  type: string;
  platform: string;
  created_at: string;
  display_name?: string;
  from_display_name?: string;
  amount?: string;
  crate_item?: any;
  message?: string;
  product?: string;
  viewers?: number;
  host_type?: 'manual' | 'auto';
  raiders?: number;
  formatted_amount?: string;
  sub_plan?: string;
  months?: number;
  streak_months?: number;
  gifter?: string;
  currency?: string;
  skill?: string;
  since?: string;
  displayString?: string;
  comment?: string;
  title?: string;
}

interface IRecentEventsState {
  recentEvents: IRecentEvent[];
  muted: boolean;
}

const subscriptionMap = (subPlan: string) => {
  return {
    '1000': $t('Tier 1'),
    '2000': $t('Tier 2'),
    '3000': $t('Tier 3'),
    Prime: $t('Prime'),
  }[subPlan];
};

export class RecentEventsService extends StatefulService<IRecentEventsState> {
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;
  @Inject() windowsService: WindowsService;

  static initialState: IRecentEventsState = { recentEvents: null, muted: false };

  lifecycle: LoginLifecycle;

  async initialize() {
    this.lifecycle = await this.userService.withLifecycle({
      init: this.syncEventsState,
      destroy: () => Promise.resolve(),
      context: this,
    });
  }

  syncEventsState() {
    this.formEventsArray();
    return this.fetchMutedState();
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

  fetchMutedState() {
    const url = `https://${
      this.hostsService.streamlabs
    }/api/v5/slobs/widget/config?widget=recent_events`;
    const headers = authorizedHeaders(this.userService.apiToken);
    return fetch(new Request(url, { headers }))
      .then(handleResponse)
      .then(resp => this.SET_MUTED(resp.eventsPanelMuted));
  }

  async formEventsArray() {
    const events = await this.fetchRecentEvents();
    let eventArray: IRecentEvent[] = [];
    if (!events.data) return;
    Object.keys(events.data).forEach(key => {
      eventArray = eventArray.concat(events.data[key]);
    });

    eventArray.sort((a: IRecentEvent, b: IRecentEvent) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    this.SET_RECENT_EVENTS(eventArray);
  }

  async repeatAlert(event: IRecentEvent) {
    const headers = authorizedHeaders(
      this.userService.apiToken,
      new Headers({ 'Content-Type': 'application/json' }),
    );
    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/widget/repeatalert`;
    const body = JSON.stringify({
      data: event,
      type: event.type,
      token: this.userService.widgetToken,
    });
    return await fetch(new Request(url, { headers, body, method: 'POST' })).then(handleResponse);
  }

  async skipAlert() {
    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/alerts/skip`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers, method: 'POST' });
    return await fetch(request).then(handleResponse);
  }

  async pauseAlertQueue() {
    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/alerts/pause_queue`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers, method: 'POST' });
    return fetch(request).then(handleResponse);
  }

  async unpauseAlertQueue() {
    const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/alerts/unpause_queue`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers, method: 'POST' });
    return fetch(request).then(handleResponse);
  }

  getSubString(event: IRecentEvent) {
    if (event.gifter) {
      return $t('has gifted a sub (%{tier}) to', {
        tier: subscriptionMap(event.sub_plan),
      });
    }
    if (event.months > 1) {
      return $t('has resubscribed (%{tier}) for %{streak} months in a row! (%{months} total)', {
        tier: subscriptionMap(event.sub_plan),
        streak: event.streak_months,
        months: event.months,
      });
    }
    if (event.platform === 'youtube') {
      return $t('has sponsored since %{date}', { date: event.since });
    }
    return $t('has subscribed (%{tier})', { tier: subscriptionMap(event.sub_plan) });
  }

  getEventString(event: IRecentEvent) {
    return {
      donation:
        $t('has donated') +
        (event.crate_item ? $t(' with %{name}', { name: event.crate_item.name }) : ''),
      merch: $t('has purchased %{product} from the store', { product: event.product }),
      follow: $t('has followed'),
      subscription: this.getSubString(event),
      // Twitch
      bits: $t('has used %{amount} bits', { amount: event.amount }),
      host: $t('has hosted you with %{viewers} viewers', { viewers: event.viewers }),
      raid: $t('has raided you with a party of %{viewers}', { viewers: event.raiders }),
      // Mixer
      sticker: $t('has used %{amount} %{currency} for %{skill}', {
        amount: event.amount,
        currency: event.currency,
        skill: event.skill,
      }),
      effect: $t('has used %{amount} %{currency} for %{skill}', {
        amount: event.amount,
        currency: event.currency,
        skill: event.skill,
      }),
      // Facebook
      like: $t('has liked'),
      stars: $t('has used %{amount} stars', { amount: event.amount }),
      support: $t('has supported for %{mounths} months', { months: event.months }),
      share: $t('has shared'),
      // Youtube
      superchat: $t('has superchatted %{amount}', { amount: event.displayString }),
      // Integrations
      pledge: $t('has pledged on Patreon'),
      eldonation: $t('has donated to ExtraLife'),
      tiltifydonation: $t('has donated to Tiltify'),
      donordrivedonation: $t('has donated to Donor Drive'),
      justgivingdonation: $t('has donated to Just Giving'),
      treat: $t('has given a treat %{title}', { title: event.title }),
    }[event.type];
  }

  async toggleMuteEvents() {
    const headers = authorizedHeaders(
      this.userService.apiToken,
      new Headers({ 'Content-Type': 'application/json' }),
    );
    const url = `https://${
      this.hostsService.streamlabs
    }/api/v5/slobs/widget/recentevents/eventspanel`;
    const body = JSON.stringify({ muted: !this.state.muted });
    return await fetch(new Request(url, { headers, body, method: 'POST' }))
      .then(handleResponse)
      .then(() => this.SET_MUTED(!this.state.muted));
  }

  openRecentEventsWindow(isMediaShare?: boolean) {
    this.windowsService.createOneOffWindow(
      {
        componentName: 'RecentEvents',
        queryParams: { isMediaShare },
        title: $t('Recent Events'),
        size: { width: 800, height: 600 },
      },
      'RecentEvents',
    );
  }

  @mutation()
  SET_RECENT_EVENTS(eventArray: IRecentEvent[]) {
    this.state.recentEvents = eventArray;
  }

  @mutation()
  SET_MUTED(muted: boolean) {
    this.state.muted = muted;
  }
}
