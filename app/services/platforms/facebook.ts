import { StatefulService, mutation } from '../core/stateful-service';
import {
  IPlatformService,
  IGame,
  TPlatformCapability,
  TPlatformCapabilityMap,
  EPlatformCallResult,
  IPlatformRequest,
} from '.';
import { HostsService } from '../hosts';
import { Inject } from '../core/injector';
import { authorizedHeaders, handleResponse } from '../../util/requests';
import { UserService } from '../user';
import { IPlatformResponse, platformAuthorizedRequest, platformRequest } from './utils';
import { IListOption } from '../../components/shared/inputs';
import { $t } from 'services/i18n';
import { StreamSettingsService } from 'services/settings/streaming';
import { Subject } from 'rxjs';

interface IFacebookPage {
  access_token: string;
  name: string;
  id: string;
}

interface IFacebookLiveVideo {
  status: string;
  id: number;
  stream_url: string;
  title: string;
  game: string;
  description: string;
}

export interface IStreamlabsFacebookPage {
  id: string;
  category: string;
  name: string;
}

export interface IStreamlabsFacebookPages {
  pages: IStreamlabsFacebookPage[];
  page_id: string;
  page_type: string;
  name: string;
  options: IListOption<string>[];
}

interface IFacebookServiceState {
  activePage: IFacebookPage;
  liveVideoId: number;
  streamUrl: string;
  streamProperties: { title: string; description: string; game: string };
  facebookPages: IStreamlabsFacebookPages;
}

export interface IFacebookStartStreamOptions {
  facebookPageId: string;
  title: string;
  game: string;
  description: string;
}

export interface IFacebookChanelInfo extends IFacebookStartStreamOptions {
  chatUrl: string;
  streamUrl: string;
}

export class FacebookService extends StatefulService<IFacebookServiceState>
  implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() streamSettingsService: StreamSettingsService;
  @Inject() userService: UserService;

  capabilities = new Set<TPlatformCapability>([
    'chat',
    'user-info',
    'viewer-count',
    'stream-schedule',
    'account-merging',
  ]);

  channelInfoChanged = new Subject<IFacebookChanelInfo>();

  authWindowOptions: Electron.BrowserWindowConstructorOptions = { width: 800, height: 800 };

  static initialState: IFacebookServiceState = {
    activePage: null,
    liveVideoId: null,
    streamUrl: null,
    streamProperties: { title: null, description: null, game: null },
    facebookPages: null,
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

  @mutation()
  private SET_FACEBOOK_PAGES(pages: IStreamlabsFacebookPages) {
    this.state.facebookPages = pages;
  }

  apiBase = 'https://graph.facebook.com';

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const query = `_=${Date.now()}&skip_splash=true&external=electron&facebook&force_verify&origin=slobs`;
    return `https://${host}/slobs/login?${query}`;
  }

  get mergeUrl() {
    const host = this.hostsService.streamlabs;
    const token = this.userService.apiToken;
    return `https://${host}/slobs/merge/${token}/facebook_account`;
  }

  get oauthToken() {
    return this.userService.state.auth.platforms.facebook.token;
  }

  get activeToken() {
    return this.state.activePage.access_token;
  }

  validatePlatform() {
    return Promise.resolve(EPlatformCallResult.Success);
  }

  getHeaders(req: IPlatformRequest, useToken: boolean | string) {
    const token = typeof useToken === 'string' ? useToken : useToken && this.oauthToken;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  fetchNewToken(): Promise<void> {
    // FB Doesn't have token refresh, user must login again to update token
    return Promise.resolve();
  }

  async fetchActivePage() {
    await this.fetchPages();
    return platformAuthorizedRequest<{ data: IFacebookPage[] }>(
      'facebook',
      `${this.apiBase}/me/accounts`,
    ).then(async json => {
      const pageId = this.userService.platform.channelId || this.state.facebookPages.page_id;
      const activePage = json.data.filter(page => pageId === page.id)[0] || json.data[0];
      this.userService.updatePlatformChannelId('facebook', pageId);
      this.SET_ACTIVE_PAGE(activePage);
    });
  }

  fetchUserInfo() {
    return Promise.resolve({});
  }

  private createLiveVideo(): Promise<string> {
    const { title, description, game } = this.state.streamProperties;
    const data = {
      method: 'POST',
      body: JSON.stringify({ title, description, game_specs: { name: game } }),
    };

    return platformRequest<{ stream_url: string; id: number }>(
      'facebook',
      {
        url: `${this.apiBase}/${this.state.activePage.id}/live_videos`,
        ...data,
      },
      this.activeToken,
    )
      .then(json => {
        const streamKey = json.stream_url.substr(json.stream_url.lastIndexOf('/') + 1);
        this.SET_LIVE_VIDEO_ID(json.id);
        this.streamSettingsService.setSettings({ key: streamKey });
        return streamKey;
      })
      .catch(resp =>
        Promise.reject($t('Something went wrong while going live, please try again.')),
      );
  }

  /**
   * fetch prefill data
   */
  async prepopulateInfo(): Promise<IFacebookStartStreamOptions> {
    await this.fetchActivePage();
    if (!this.state.activePage || !this.state.activePage.id) {
      return {} as IFacebookStartStreamOptions; // TODO: should resolve this case smarter
    }
    const url =
      `${this.apiBase}/${this.state.activePage.id}/live_videos?` +
      'fields=status,stream_url,title,description';
    return platformRequest<{ data: IFacebookLiveVideo[] }>('facebook', url, this.activeToken).then(
      json => {
        const info =
          json.data.find((vid: any) => vid.status === 'SCHEDULED_UNPUBLISHED') || json.data[0];
        if (info && ['SCHEDULED_UNPUBLISHED', 'LIVE_STOPPED'].includes(info.status)) {
          this.SET_LIVE_VIDEO_ID(info.id);
          this.SET_STREAM_URL(info.stream_url);
        } else {
          this.SET_LIVE_VIDEO_ID(null);
        }
        this.emitChannelInfo();
        return {
          ...info,
          facebookPageId: this.state.activePage.id,
        };
      },
    );
  }

  emitChannelInfo() {
    this.channelInfoChanged.next({
      ...this.state.streamProperties,
      facebookPageId: this.state.activePage.id,
      streamUrl: this.state.streamUrl,
      chatUrl: this.getChatUrl(),
    });
  }

  scheduleStream(
    scheduledStartTime: string,
    { title, description, game }: IFacebookChanelInfo,
  ): Promise<any> {
    const url = `${this.apiBase}/${this.state.activePage.id}/live_videos`;
    const body = JSON.stringify({
      title,
      description,
      planned_start_time: new Date(scheduledStartTime).getTime() / 1000,
      game_specs: { name: game },
      status: 'SCHEDULED_UNPUBLISHED',
    });
    return platformRequest('facebook', { url, body, method: 'POST' }, this.activeToken);
  }

  fetchViewerCount(): Promise<number> {
    if (this.state.liveVideoId == null) return Promise.resolve(0);

    const url = `${this.apiBase}/${this.state.liveVideoId}?fields=live_views`;

    return platformRequest<{ live_views: number }>('facebook', url, this.activeToken)
      .then(json => json.live_views)
      .catch(() => 0);
  }

  async beforeGoLive(options: IFacebookStartStreamOptions) {
    await this.prepopulateInfo();
    await this.putChannelInfo(options);
    this.streamSettingsService.setSettings({ platform: 'facebook', streamType: 'rtmp_common' });

    // This generally happens when a stream was scheduled, or when we
    // fetched an existing stopped or scheduled stream from the API.
    if (this.state.streamUrl) {
      const streamKey = this.state.streamUrl.substr(this.state.streamUrl.lastIndexOf('/') + 1);
      this.streamSettingsService.setSettings({
        key: streamKey,
        platform: 'facebook',
        streamType: 'rtmp_common',
      });
      this.SET_STREAM_URL(null);
      return streamKey;
    }

    if (this.state.activePage) {
      return await this.createLiveVideo();
    }

    this.emitChannelInfo();

    return null;
  }

  async putChannelInfo(info: IFacebookStartStreamOptions): Promise<boolean> {
    const { title, description, game, facebookPageId } = info;
    this.SET_STREAM_PROPERTIES(title, description, game);
    await this.postPage(facebookPageId);
    if (this.state.liveVideoId && game) {
      return platformRequest(
        'facebook',
        {
          url: `${this.apiBase}/${this.state.liveVideoId}`,
          method: 'POST',
          body: JSON.stringify({ title, description, game_specs: { name: game } }),
        },
        this.state.activePage.access_token,
      ).then(() => true);
    }
    return Promise.resolve(true);
  }

  async searchGames(searchString: string): Promise<IGame[]> {
    if (searchString.length < 2) return;
    return platformAuthorizedRequest<{ data: IGame[] }>(
      'facebook',
      `${this.apiBase}/v3.2/search?type=game&q=${searchString}`,
    ).then(json => json.data);
  }

  private getChatUrl(): string {
    return 'https://www.facebook.com/gaming/streamer/chat/';
  }

  // TODO: dedup
  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService {
    return this.capabilities.has(capability);
  }

  fetchRawPageResponse() {
    return platformRequest<{ data: IFacebookPage[] }>('facebook', `${this.apiBase}/me/accounts`);
  }

  liveDockEnabled(): boolean {
    return true;
  }

  private fetchPages(): Promise<IStreamlabsFacebookPages> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/user/facebook/pages`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });
    return fetch(request)
      .then(handleResponse)
      .then(response => {
        // create an options list for using in the ListInput
        response.options = response.pages.map((page: any) => {
          return { value: page.id, title: `${page.name} | ${page.category}` };
        });
        this.SET_FACEBOOK_PAGES(response);
        return response;
      })
      .catch(() => null);
  }

  private postPage(pageId: string) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/user/facebook/pages`;
    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/json');
    const request = new Request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({ page_id: pageId, page_type: 'page' }),
    });
    try {
      fetch(request).then(() => this.userService.updatePlatformChannelId('facebook', pageId));
    } catch {
      console.error(new Error('Could not set Facebook page'));
    }
  }

  /**
   * Get user-friendly error message
   */
  getErrorDescription(error: IPlatformResponse<unknown>): string {
    return `Can not connect to Facebook: ${error.message}`;
  }
}
