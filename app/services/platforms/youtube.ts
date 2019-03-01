import { Service } from '../service';
import { StatefulService, mutation } from '../stateful-service';
import {
  IPlatformService,
  IChannelInfo,
  IPlatformAuth,
  TPlatformCapability,
  TPlatformCapabilityMap,
} from '.';
import { HostsService } from '../hosts';
import { SettingsService } from '../settings';
import { Inject } from '../../util/injector';
import { handleResponse, requiresToken, authorizedHeaders } from '../../util/requests';
import { UserService } from '../user';

interface IYoutubeServiceState {
  liveStreamingEnabled: boolean;
  liveStreamId: string;
  scheduledStartTime: string;
  channelInfo: IChannelInfo;
}

export class YoutubeService extends StatefulService<IYoutubeServiceState>
  implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;

  capabilities = new Set<TPlatformCapability>(['chat', 'stream-schedule']);

  static initialState: IYoutubeServiceState = {
    liveStreamingEnabled: true,
    liveStreamId: null,
    scheduledStartTime: null,
    channelInfo: { title: null, description: null },
  };

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1000,
    height: 600,
  };

  apiBase = 'https://www.googleapis.com/youtube/v3';

  get authUrl() {
    const host = this.hostsService.streamlabs;
    return (
      `https://${host}/slobs/login?_=${Date.now()}` +
      '&skip_splash=true&external=electron&youtube&force_verify&origin=slobs'
    );
  }

  get oauthToken() {
    return this.userService.platform.token;
  }

  get youtubeId() {
    return this.userService.platform.id;
  }

  @mutation()
  private SET_ENABLED_STATUS(enabled: boolean) {
    this.state.liveStreamingEnabled = enabled;
  }

  @mutation()
  private SET_STREAM_ID(id: string) {
    this.state.liveStreamId = id;
  }

  @mutation()
  private SET_SCHEDULED_START_TIME(time: string) {
    this.state.scheduledStartTime = time;
  }

  @mutation()
  private SET_CHANNEL_INFO(info: IChannelInfo) {
    this.state.channelInfo = info;
  }

  setupStreamSettings(auth: IPlatformAuth) {
    this.fetchStreamKey().then(streamKey => {
      const settings = this.settingsService.getSettingsFormData('Stream');

      settings.forEach(subCategory => {
        subCategory.parameters.forEach(parameter => {
          if (parameter.name === 'service') {
            parameter.value = 'YouTube / YouTube Gaming';
          }
          if (parameter.name === 'key') {
            parameter.value = streamKey;
          }
        });
      });

      this.settingsService.setSettings('Stream', settings);
    });
  }

  fetchDescription(): Promise<string> {
    return this.userService
      .getDonationSettings()
      .then(json =>
        json.settings.autopublish ? `Support the stream: ${json.donation_url} \n` : '',
      );
  }

  ableToStream(): Promise<void> {
    const endpoint = 'liveBroadcasts?part=contentDetails&mine=true&broadcastType=persistent';
    const request = new Request(`${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`);

    return fetch(request)
      .then(resp => (resp.status === 403 ? this.handleForbidden(resp) : handleResponse(resp)))
      .then(() => this.SET_ENABLED_STATUS(true));
  }

  fetchUserInfo() {
    return Promise.resolve({});
  }

  @requiresToken()
  fetchBoundStreamId(): Promise<string> {
    const endpoint = 'liveBroadcasts?part=contentDetails&mine=true&broadcastType=persistent';
    const request = new Request(`${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`);

    return fetch(request)
      .then(handleResponse)
      .then(json => json.items[0].contentDetails.boundStreamId);
  }

  handleForbidden(response: Response): void {
    response.json().then((json: any) => {
      if (
        json.error &&
        json.error.errors &&
        json.error.errors[0].reason === 'liveStreamingNotEnabled'
      ) {
        this.SET_ENABLED_STATUS(false);
      }
    });
  }

  @requiresToken()
  fetchStreamKeyForId(streamId: string): Promise<string> {
    const endpoint = `liveStreams?part=cdn&id=${streamId}`;
    const request = new Request(`${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`);

    return fetch(request)
      .then(handleResponse)
      .then(json => json.items[0].cdn.ingestionInfo.streamName);
  }

  fetchStreamKey(): Promise<string> {
    return this.fetchBoundStreamId().then(boundStreamId => this.fetchStreamKeyForId(boundStreamId));
  }

  fetchChannelInfo(): Promise<IChannelInfo> {
    return Promise.resolve(this.state.channelInfo);
  }

  @requiresToken()
  getLiveStreamId(forceGet: boolean): Promise<void> {
    if (this.state.liveStreamId && !forceGet) return Promise.resolve();

    const endpoint = 'liveBroadcasts?part=id&broadcastStatus=active&broadcastType=persistent';
    const request = new Request(`${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`);

    return fetch(request)
      .then(handleResponse)
      .then(json => {
        if (json.items.length) {
          this.SET_STREAM_ID(json.items[0].id);
        }
      });
  }

  @requiresToken()
  fetchViewerCount(): Promise<number> {
    return this.getLiveStreamId(false).then(() => {
      const endpoint = 'videos?part=snippet,liveStreamingDetails';
      const url = `${this.apiBase}/${endpoint}&id=${this.state.liveStreamId}&access_token=${
        this.oauthToken
      }`;
      const request = new Request(url);

      return fetch(request)
        .then(handleResponse)
        .then(json => json.items[0].liveStreamingDetails.concurrentViewers || 0);
    });
  }

  prepopulateInfo() {
    return this.fetchPrefillData();
  }

  @requiresToken()
  fetchPrefillData() {
    const query = `part=snippet,contentDetails,status&broadcastStatus=upcoming&access_token=${
      this.oauthToken
    }`;
    return fetch(`${this.apiBase}/liveBroadcasts?${query}`)
      .then(handleResponse)
      .then(json => {
        if (!json.items.length) return;
        this.SET_STREAM_ID(json.items[0].id);
        this.SET_SCHEDULED_START_TIME(json.items[0].snippet.scheduledStartTime);
        return json.items[0].snippet;
      });
  }

  @requiresToken()
  scheduleStream(scheduledStartTime: string, { title, description }: IChannelInfo): Promise<any> {
    const url = `${this.apiBase}/liveBroadcasts?part=snippet,status`;
    const headers = authorizedHeaders(this.oauthToken);
    headers.append('Content-Type', 'application/json');
    const body = JSON.stringify({
      snippet: { scheduledStartTime, title, description },
      status: { privacyStatus: 'public' },
    });
    const req = new Request(url, { headers, body, method: 'POST' });
    return fetch(req).then(handleResponse);
  }

  fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/youtube/token`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleResponse)
      .then(response => this.userService.updatePlatformToken(response.access_token));
  }

  @requiresToken()
  putChannelInfo({ title, description }: IChannelInfo): Promise<boolean> {
    this.SET_CHANNEL_INFO({ title, description });
    return this.getLiveStreamId(false)
      .then(() => this.fetchDescription())
      .then(autopublishString => {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');

        const fullDescription = new RegExp(autopublishString).test(description)
          ? description
          : autopublishString.concat(description);
        const body = JSON.stringify({
          snippet: {
            title,
            description: fullDescription,
            scheduledStartTime: this.state.scheduledStartTime || new Date().toISOString(),
          },
          status: { privacyStatus: 'public' },
          id: this.state.liveStreamId,
        });
        const endpoint = 'liveBroadcasts?part=snippet,status';
        const method = this.state.liveStreamId ? 'PUT' : 'POST';
        const request = new Request(`${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`, {
          method,
          headers,
          body,
        });

        return fetch(request)
          .then(handleResponse)
          .then(() => true);
      });
  }

  searchGames(searchString: string) {
    return Promise.resolve(JSON.parse(''));
  }

  searchCommunities(searchString: string) {
    return Promise.resolve(JSON.parse(''));
  }

  @requiresToken()
  getChatUrl(mode: string) {
    const endpoint = 'liveBroadcasts?part=id&mine=true&broadcastType=persistent';
    const request = new Request(`${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`);

    return fetch(request)
      .then(handleResponse)
      .then(json => {
        const youtubeDomain = mode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
        this.SET_STREAM_ID(json.items[0].id);
        return `${youtubeDomain}/live_chat?v=${json.items[0].id}&is_popout=1`;
      });
  }

  verifyAbleToStream(): void {
    this.fetchNewToken().then(() => this.ableToStream());
  }

  beforeGoLive() {
    return Promise.resolve();
  }

  // TODO: dedup
  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService {
    return this.capabilities.has(capability);
  }
}
