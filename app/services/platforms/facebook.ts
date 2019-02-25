import { StatefulService, mutation } from '../stateful-service';
import {
  IPlatformService,
  IPlatformAuth,
  IChannelInfo,
  IGame,
  TPlatformCapability,
  TPlatformCapabilityMap,
} from '.';
import { HostsService } from '../hosts';
import { SettingsService } from '../settings';
import { Inject } from '../../util/injector';
import { handleResponse, authorizedHeaders, requiresToken } from '../../util/requests';
import { UserService } from '../user';

interface IFacebookPage {
  access_token: string;
  name: string;
  id: string;
}

export interface IStreamlabsFacebookPage {
  id: string;
  category: string;
  name: string;
}

export interface IStreamlabsFacebookPages {
  pages: IStreamlabsFacebookPage[];
  page_id: string;
}

interface IFacebookServiceState {
  activePage: IFacebookPage;
  liveVideoId: number;
  streamUrl: string;
  streamProperties: IChannelInfo;
}

export class FacebookService extends StatefulService<IFacebookServiceState>
  implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;

  capabilities = new Set<TPlatformCapability>([
    'chat',
    'user-info',
    'viewer-count',
    'stream-schedule',
  ]);

  authWindowOptions: Electron.BrowserWindowConstructorOptions = { width: 800, height: 800 };

  static initialState: IFacebookServiceState = {
    activePage: null,
    liveVideoId: null,
    streamUrl: null,
    streamProperties: { title: null, description: null, game: null },
  };

  @mutation()
  private SET_ACTIVE_PAGE(page: IFacebookPage) {
    this.state.activePage = page;
  }

  @mutation()
  private SET_LIVE_VIDEO_ID(id: number) {
    this.state.liveVideoId = id;
  }

  @mutation()
  private SET_STREAM_URL(url: string) {
    this.state.streamUrl = url;
  }

  @mutation()
  private SET_STREAM_PROPERTIES(title: string, description: string, game: string) {
    this.state.streamProperties = { title, description, game };
  }

  apiBase = 'https://graph.facebook.com';

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const query = `_=${Date.now()}&skip_splash=true&external=electron&facebook&force_verify&origin=slobs`;
    return `https://${host}/slobs/login?${query}`;
  }

  get oauthToken() {
    return this.userService.platform.token;
  }

  get activeToken() {
    return this.state.activePage.access_token;
  }

  getHeaders(token = this.oauthToken): Headers {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', `Bearer ${token}`);
    return headers;
  }

  formRequest(url: string, data?: any, token = this.oauthToken) {
    const headers = this.getHeaders(token);
    return new Request(url, { headers, ...data });
  }

  setupStreamSettings() {
    this.fetchStreamKey().then(key => this.setSettingsWithKey(key));
  }

  fetchNewToken(): Promise<void> {
    // FB Doesn't have token refresh, user must login again to update token
    return Promise.resolve();
  }

  fetchRawChannelInfo() {
    return this.fetchUserPagePreference();
  }

  fetchPages() {
    const request = this.formRequest(`${this.apiBase}/me/accounts`);
    return fetch(request)
      .then(handleResponse)
      .then(async json => {
        let pageId = this.userService.platform.channelId;
        if (!pageId) {
          const pages = await this.userService.getFacebookPages();
          pageId = pages.page_id;
        }
        const activePage =
          json.data.filter((page: IFacebookPage) => pageId === page.id)[0] || json.data[0];
        this.SET_ACTIVE_PAGE(activePage);
      });
  }

  fetchUserPagePreference() {
    return this.userService.getFacebookPages().then(json => {
      const pageId = json.page_type === 'page' && json.page_id ? json.page_id : '0';
      this.userService.updatePlatformChannelId(pageId);
      return json;
    });
  }

  fetchStreamKey(): Promise<string> {
    return Promise.resolve('Key is set automatically when going live');
  }

  fetchChannelInfo(): Promise<IChannelInfo> {
    if (this.state.streamProperties.title) {
      return Promise.resolve(this.state.streamProperties);
    }
    return this.fetchRawChannelInfo().then(json => {
      const gameTitle = json.type && json.type.name ? json.type.name : '';
      return { title: json.name, game: gameTitle };
    });
  }

  fetchUserInfo() {
    return Promise.resolve({});
  }

  createLiveVideo() {
    if (this.settingsService.state.Stream.service !== 'Facebook Live') return Promise.resolve();
    const { title, description, game } = this.state.streamProperties;
    const data = {
      method: 'POST',
      body: JSON.stringify({ title, description, game_specs: { name: game } }),
    };
    const request = this.formRequest(
      `${this.apiBase}/${this.state.activePage.id}/live_videos`,
      data,
      this.activeToken,
    );
    return fetch(request)
      .then(handleResponse)
      .then(json => {
        const streamKey = json.stream_url.substr(json.stream_url.lastIndexOf('/') + 1);
        this.SET_LIVE_VIDEO_ID(json.id);
        this.setSettingsWithKey(streamKey);
      });
  }

  prepopulateInfo() {
    return this.fetchPages().then(() => this.fetchPrefillData());
  }

  fetchPrefillData() {
    if (!this.state.activePage || !this.state.activePage.id) return;
    const url =
      `${this.apiBase}/${this.state.activePage.id}/live_videos?` +
      'fields=status,stream_url,title,description';
    const request = this.formRequest(url, {}, this.activeToken);
    return fetch(request)
      .then(handleResponse)
      .then(json => {
        const info =
          json.data.find((vid: any) => vid.status === 'SCHEDULED_UNPUBLISHED') || json.data[0];
        if (info && ['SCHEDULED_UNPUBLISHED', 'LIVE_STOPPED'].includes(info.status)) {
          this.SET_LIVE_VIDEO_ID(info.id);
          this.SET_STREAM_URL(info.stream_url);
        }
        return info;
      });
  }

  scheduleStream(
    scheduledStartTime: string,
    { title, description, game }: IChannelInfo,
  ): Promise<any> {
    const url = `${this.apiBase}/${this.state.activePage.id}/live_videos`;
    const headers = authorizedHeaders(this.activeToken);
    headers.append('Content-Type', 'application/json');
    const body = JSON.stringify({
      title,
      description,
      planned_start_time: new Date(scheduledStartTime).getTime() / 1000,
      game_specs: { name: game },
      status: 'SCHEDULED_UNPUBLISHED',
    });
    const req = new Request(url, { headers, body, method: 'POST' });
    return fetch(req).then(handleResponse);
  }

  fetchViewerCount(): Promise<number> {
    const url = `${this.apiBase}/${this.state.liveVideoId}?fields=live_views`;
    const request = this.formRequest(url, {}, this.activeToken);
    return fetch(request)
      .then(handleResponse)
      .then(json => json.live_views);
  }

  fbGoLive() {
    return new Promise(resolve => {
      if (this.state.streamUrl && this.settingsService.state.Stream.service === 'Facebook Live') {
        const streamKey = this.state.streamUrl.substr(this.state.streamUrl.lastIndexOf('/') + 1);
        this.setSettingsWithKey(streamKey);
        this.SET_STREAM_URL(null);
        resolve();
      } else {
        return this.state.activePage ? this.createLiveVideo().then(() => resolve()) : resolve();
      }
    });
  }

  putChannelInfo({ title, description, game }: IChannelInfo): Promise<boolean> {
    this.SET_STREAM_PROPERTIES(title, description, game);
    if (this.state.liveVideoId && game) {
      const headers = this.getHeaders(this.state.activePage.access_token);
      const data = { title, description, game_specs: { name: game } };
      const request = new Request(`${this.apiBase}/${this.state.liveVideoId}`, {
        headers,
        method: 'POST',
        body: JSON.stringify(data),
      });
      return fetch(request)
        .then(handleResponse)
        .then(() => true);
    }
    return Promise.resolve(true);
  }

  @requiresToken()
  async searchGames(searchString: string): Promise<IGame[]> {
    if (searchString.length < 2) return;
    const url = `${this.apiBase}/v3.2/search?type=game&q=${searchString}`;
    const headers = this.getHeaders();
    const request = new Request(url, { headers, method: 'GET' });
    return fetch(request)
      .then(handleResponse)
      .then((json: any) => json.data);
  }

  getChatUrl(): Promise<string> {
    return Promise.resolve('https://www.facebook.com/gaming/streamer/chat/');
  }

  beforeGoLive() {
    return this.fetchPages().then(() => this.fbGoLive());
  }

  private setSettingsWithKey(key: string) {
    const settings = this.settingsService.getSettingsFormData('Stream');
    settings.forEach(subCategory => {
      subCategory.parameters.forEach(parameter => {
        if (parameter.name === 'service') {
          parameter.value = 'Facebook Live';
        }
        if (parameter.name === 'key') {
          parameter.value = key;
        }
      });
    });
    this.settingsService.setSettings('Stream', settings);
  }

  // TODO: dedup
  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService {
    return this.capabilities.has(capability);
  }
}
