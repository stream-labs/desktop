import { mutation, InheritMutations } from '../core/stateful-service';
import {
  IPlatformService,
  IGame,
  TPlatformCapability,
  EPlatformCallResult,
  IPlatformRequest,
  IPlatformState,
} from '.';
import { HostsService } from 'services/hosts';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, handleResponse, jfetch } from 'util/requests';
import { UserService } from 'services/user';
import { IPlatformResponse, platformAuthorizedRequest, platformRequest } from './utils';
import { IListOption } from 'components/shared/inputs';
import { $t } from 'services/i18n';
import { StreamSettingsService } from 'services/settings/streaming';
import { assertIsDefined } from 'util/properties-type-guards';
import { IGoLiveSettings } from 'services/streaming';
import { throwStreamError } from 'services/streaming/stream-error';
import { BasePlatformService } from './base-platform';

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

interface IFacebookServiceState extends IPlatformState {
  activePage: IFacebookPage | null;
  liveVideoId: number | null;
  streamUrl: string | null;
  settings: IFacebookStartStreamOptions;
  facebookPages: IStreamlabsFacebookPages | null;
}

export interface IFacebookStartStreamOptions {
  facebookPageId: string;
  title: string;
  game: string;
  description?: string;
}

export interface IFacebookChannelInfo extends IFacebookStartStreamOptions {
  chatUrl: string;
  streamUrl: string;
}

@InheritMutations()
export class FacebookService extends BasePlatformService<IFacebookServiceState>
  implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() streamSettingsService: StreamSettingsService;
  @Inject() userService: UserService;

  readonly platform = 'facebook';
  readonly displayName = 'Facebook';

  readonly capabilities = new Set<TPlatformCapability>([
    'chat',
    'description',
    'game',
    'user-info',
    'stream-schedule',
    'account-merging',
  ]);

  authWindowOptions: Electron.BrowserWindowConstructorOptions = { width: 800, height: 800 };

  static initialState: IFacebookServiceState = {
    ...BasePlatformService.initialState,
    activePage: null,
    liveVideoId: null,
    streamUrl: null,
    facebookPages: null,
    settings: {
      facebookPageId: '',
      title: '',
      description: '',
      game: '',
    },
  };

  protected init() {
    this.syncSettingsWithLocalStorage();
  }

  @mutation()
  private SET_ACTIVE_PAGE(page: IFacebookPage) {
    this.state.activePage = page;
  }

  @mutation()
  private SET_LIVE_VIDEO_ID(id: number | null) {
    this.state.liveVideoId = id;
  }

  @mutation()
  private SET_STREAM_URL(url: string | null) {
    this.state.streamUrl = url;
  }

  @mutation()
  private SET_STREAM_PROPERTIES(
    title: string,
    description: string | undefined,
    game: string,
    facebookPageId: string,
  ) {
    this.state.settings = { title, description, game, facebookPageId };
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
    return this.userService.state.auth?.platforms?.facebook?.token;
  }

  get activeToken() {
    return this.state.activePage?.access_token;
  }

  get streamPageUrl(): string {
    if (!this.state.activePage) return '';
    const pathToPage = `${this.state.activePage.name}-${this.state.activePage.id}`.replace(
      ' ',
      '-',
    );
    return `https://www.facebook.com/${pathToPage}/live_videos`;
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
    return this.requestFacebook<{ data: IFacebookPage[] }>(`${this.apiBase}/me/accounts`).then(
      async json => {
        const pageId = this.userService.platform?.channelId || this.state.facebookPages?.page_id!;
        const activePage = json.data.filter(page => pageId === page.id)[0] || json.data[0];
        this.userService.updatePlatformChannelId('facebook', pageId);
        this.SET_ACTIVE_PAGE(activePage);
      },
    );
  }

  fetchUserInfo() {
    return Promise.resolve({});
  }

  /**
   * Request Facebook API and wrap failed response to a unified error model
   */
  private async requestFacebook<T = unknown>(
    reqInfo: IPlatformRequest | string,
    token?: string,
  ): Promise<T> {
    try {
      return token
        ? await platformRequest<T>('facebook', reqInfo, token)
        : await platformAuthorizedRequest<T>('facebook', reqInfo);
    } catch (e) {
      const details = e.result?.error
        ? `${e.result.error.type} ${e.result.error.message}`
        : 'Connection failed';
      throwStreamError('PLATFORM_REQUEST_FAILED', details, 'facebook');
    }
  }

  private createLiveVideo(): Promise<string> {
    assertIsDefined(this.state.settings);
    const { title, description, game } = this.state.settings;
    const data = {
      method: 'POST',
      body: JSON.stringify({ title, description, game_specs: { name: game } }),
    };
    const pageId = this.state.activePage?.id;
    assertIsDefined(pageId);

    return this.requestFacebook<{ stream_url: string; id: number }>(
      {
        url: `${this.apiBase}/${pageId}/live_videos`,
        ...data,
      },
      this.activeToken,
    ).then(json => {
      const streamKey = json.stream_url.substr(json.stream_url.lastIndexOf('/') + 1);
      this.SET_LIVE_VIDEO_ID(json.id);
      this.SET_STREAM_KEY(streamKey);
      this.streamSettingsService.setSettings({ key: streamKey });
      return streamKey;
    });
  }

  /**
   * fetch prefill data
   */
  async prepopulateInfo(): Promise<Partial<IFacebookStartStreamOptions>> {
    await this.fetchActivePage();
    if (!this.state.activePage || !this.state.activePage.id) {
      this.SET_PREPOPULATED(true);
      return { facebookPageId: undefined };
    }
    const url =
      `${this.apiBase}/${this.state.activePage.id}/live_videos?` +
      'fields=status,stream_url,title,description';
    return this.requestFacebook<{ data: IFacebookLiveVideo[] }>(url, this.activeToken).then(
      json => {
        // First check if there are any live videos
        let info = json.data.find((vid: any) => vid.status.includes(['LIVE_STOPPED', 'LIVE']));

        // Next check for future scheduled videos
        if (!info) {
          info = json.data.find((vid: any) => vid.status === 'SCHEDULED_UNPUBLISHED');
        }

        // Finally, just fallback to the first video, which will be their most recent VOD
        if (!info) {
          info = json.data[0];
        }

        if (info && ['SCHEDULED_UNPUBLISHED', 'LIVE_STOPPED', 'LIVE'].includes(info.status)) {
          this.SET_LIVE_VIDEO_ID(info.id);
          this.SET_STREAM_URL(info.stream_url);
        } else {
          this.SET_LIVE_VIDEO_ID(null);
        }
        this.SET_PREPOPULATED(true);
        return {
          ...info,
          facebookPageId: this.state.activePage!.id,
        };
      },
    );
  }

  async scheduleStream(
    scheduledStartTime: string,
    { title, description, game }: IFacebookChannelInfo,
  ): Promise<any> {
    const url = `${this.apiBase}/${this.state.activePage!.id}/live_videos`;
    const body = JSON.stringify({
      title,
      description,
      planned_start_time: new Date(scheduledStartTime).getTime() / 1000,
      game_specs: { name: game },
      status: 'SCHEDULED_UNPUBLISHED',
    });
    try {
      return await platformRequest('facebook', { url, body, method: 'POST' }, this.activeToken);
    } catch (e) {
      if (e?.result?.error?.code === 100) {
        throw new Error(
          $t(
            'Please schedule no further than 7 days in advance and no sooner than 10 minutes in advance.',
          ),
        );
      }
    }
  }

  fetchViewerCount(): Promise<number> {
    if (this.state.liveVideoId == null) return Promise.resolve(0);

    const url = `${this.apiBase}/${this.state.liveVideoId}?fields=live_views`;

    return this.requestFacebook<{ live_views: number }>(url, this.activeToken)
      .then(json => json.live_views)
      .catch(() => 0);
  }

  async beforeGoLive(options: IGoLiveSettings) {
    await this.prepopulateInfo();
    await this.putChannelInfo(options.platforms.facebook);
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
      this.SET_STREAM_KEY(streamKey);
      return;
    }

    if (this.state.activePage) {
      await this.createLiveVideo();
      return;
    }
  }

  async putChannelInfo(info: IFacebookStartStreamOptions): Promise<boolean> {
    const { title, description, game } = info;
    let facebookPageId = info.facebookPageId;
    this.SET_STREAM_PROPERTIES(title, description, game, facebookPageId);
    // take fist page if no pages provided
    assertIsDefined(this.state.facebookPages);
    if (!facebookPageId) facebookPageId = this.state.facebookPages.pages[0].id;
    assertIsDefined(facebookPageId);
    await this.postPage(facebookPageId);
    if (this.state.liveVideoId && game) {
      return this.requestFacebook(
        {
          url: `${this.apiBase}/${this.state.liveVideoId}`,
          method: 'POST',
          body: JSON.stringify({ title, description, game_specs: { name: game } }),
        },
        this.state.activePage!.access_token,
      ).then(() => true);
    }
    return Promise.resolve(true);
  }

  async searchGames(searchString: string): Promise<IGame[]> {
    if (searchString.length < 2) return [];
    return this.requestFacebook<{ data: IGame[] }>(
      `${this.apiBase}/v3.2/search?type=game&q=${searchString}`,
    ).then(json => json.data.slice(0, 15));
  }

  get chatUrl(): string {
    return 'https://www.facebook.com/gaming/streamer/chat/';
  }

  fetchRawPageResponse() {
    return this.requestFacebook<{ data: IFacebookPage[] }>(`${this.apiBase}/me/accounts`);
  }

  get liveDockEnabled(): boolean {
    return true;
  }

  private fetchPages(): Promise<IStreamlabsFacebookPages | null> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/user/facebook/pages`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers });
    return jfetch<IStreamlabsFacebookPages>(request)
      .then(response => {
        // create an options list for using in the ListInput
        response.options = response.pages.map(page => {
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
    const headers = authorizedHeaders(this.userService.apiToken!);
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

  sendPushNotif() {
    const url = 'https://streamlabs.com/api/v5/slobs/remote/notify';
    if (!this.userService.apiToken) {
      throw new Error('API token must be defined');
    }
    const headers = authorizedHeaders(
      this.userService.apiToken,
      new Headers({
        'Content-Type': 'application/json',
      }),
    );
    const postData = {
      headers,
      method: 'POST',
      body: '',
    };
    const req = new Request(url, postData);
    fetch(req);
  }
}
