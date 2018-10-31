import { Service } from '../service';
import { StatefulService, mutation } from './../stateful-service';
import { IPlatformService, IChannelInfo, IPlatformAuth } from '.';
import { HostsService } from '../hosts';
import { SettingsService } from '../settings';
import { Inject } from '../../util/injector';
import { handleErrors, requiresToken, authorizedHeaders } from '../../util/requests';
import { UserService } from '../user';

interface IYoutubeServiceState {
  liveStreamingEnabled: boolean;
}

export class YoutubeService extends StatefulService<IYoutubeServiceState> implements IPlatformService {

  @Inject() hostsService: HostsService;
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;

  static initialState: IYoutubeServiceState = {
    liveStreamingEnabled: true,
  };

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1000,
    height: 600
  };

  apiBase = 'https://www.googleapis.com/youtube/v3';
  liveStreamId = '';

  get authUrl() {
    const host = this.hostsService.streamlabs;
    return `https://${host}/slobs/login?_=${Date.now()}` +
      '&skip_splash=true&external=electron&youtube&force_verify&origin=slobs';
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
    return this.userService.getDonationSettings().then(json => {
      if (json.settings.autopublish) return `Support the stream: ${json.donation_url} \n`;
      return '';
    });
  }

  ableToStream(): Promise<void> {
    const endpoint =
      'liveBroadcasts?part=contentDetails&mine=true&broadcastType=persistent';
    const request = new Request(
      `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`
    );

    return fetch(request)
      .then(handleErrors)
      .then(response => {
        this.SET_ENABLED_STATUS(true);
      })
      .catch(err => {
        this.handleForbidden(err);
      });
  }

  fetchUserInfo() {
    return Promise.resolve({});
  }

  @requiresToken()
  fetchBoundStreamId(): Promise<string> {
    const endpoint =
      'liveBroadcasts?part=contentDetails&mine=true&broadcastType=persistent';
    const request = new Request(
      `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`
    );

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => json.items[0].contentDetails.boundStreamId);
  }

  handleForbidden(response: Response): void {
    if (response.status === 403) {
      response.json().then((json:any) => {
        if (json.error && json.error.errors && json.error.errors[0].reason === 'liveStreamingNotEnabled') {
          this.SET_ENABLED_STATUS(false);
        }
      });
    }
  }

  @requiresToken()
  fetchStreamKeyForId(streamId: string): Promise<string> {
    const endpoint = `liveStreams?part=cdn&id=${streamId}`;
    const request = new Request(
      `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`
    );

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => json.items[0].cdn.ingestionInfo.streamName);
  }

  fetchStreamKey(): Promise<string> {
    return this.fetchBoundStreamId().then(boundStreamId =>
      this.fetchStreamKeyForId(boundStreamId)
    );
  }

  // TODO
  fetchChannelInfo(): Promise<IChannelInfo> {
    return Promise.resolve({
      title: '',
      game: ''
    });
  }

  @requiresToken()
  getLiveStreamId(forceGet: boolean): Promise<void> {
    if (this.liveStreamId && !forceGet) return Promise.resolve();

    const endpoint =
      'liveBroadcasts?part=id&broadcastStatus=active&broadcastType=persistent';
    const request = new Request(
      `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`
    );

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => {
        if (json.items.length) {
          this.liveStreamId = json.items[0].id;
        }
      });
  }

  @requiresToken()
  fetchViewerCount(): Promise<number> {
    return this.getLiveStreamId(false).then(() => {
      const endpoint = 'videos?part=snippet,liveStreamingDetails';
      const url = `${this.apiBase}/${endpoint}&id=${
        this.liveStreamId
      }&access_token=${this.oauthToken}`;
      const request = new Request(url);

      return fetch(request)
        .then(handleErrors)
        .then(response => response.json())
        .then(
          json => json.items[0].liveStreamingDetails.concurrentViewers || 0
        );
    });
  }

  fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/youtube/token`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(response =>
        this.userService.updatePlatformToken(response.access_token)
      );
  }

  @requiresToken()
  putChannelInfo(streamTitle: string, streamDescription: string): Promise<boolean> {
    return this.fetchDescription().then(autopublishString => {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      const fullDescription = autopublishString.concat(streamDescription);
      const data = { snippet: { title: streamTitle, description: fullDescription }, id: this.liveStreamId };
      const endpoint = 'liveBroadcasts?part=snippet';

      const request = new Request(
        `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(data)
        }
      );

      return fetch(request)
        .then(handleErrors)
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
      .then(handleErrors)
      .then(response => response.json())
      .then(json => {
        const youtubeDomain =
          mode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
        this.liveStreamId = json.items[0].id;
        return `${youtubeDomain}/live_chat?v=${json.items[0].id}&is_popout=1`;
      });
  }

  verifyAbleToStream(): void {
    this.fetchNewToken().then(() => {
      this.ableToStream();
    });
  }

  beforeGoLive() {
    return Promise.resolve();
  }
}
