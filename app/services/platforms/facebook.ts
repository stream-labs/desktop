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
import { authorizedHeaders, handleResponse } from 'util/requests';
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

export interface IFacebookLiveVideo {
  status: 'SCHEDULED_UNPUBLISHED' | 'LIVE_STOPPED' | 'LIVE';
  id: string;
  stream_url: string;
  title: string;
  game: string;
  description: string;
  planned_start_time: number;
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
  streamUrl: string | null;
  settings: IFacebookStartStreamOptions;
}

export interface IFacebookStartStreamOptions {
  pageId: string;
  title: string;
  game: string;
  description?: string;
  liveVideoId?: string;
}

export interface IFacebookChannelInfo extends IFacebookStartStreamOptions {
  chatUrl: string;
  streamUrl: string;
}

const initialState: IFacebookServiceState = {
  ...BasePlatformService.initialState,
  streamUrl: null,
  settings: {
    pageId: '',
    liveVideoId: '',
    title: '',
    description: '',
    game: '',
  },
};

@InheritMutations()
export class FacebookService extends BasePlatformService<IFacebookServiceState>
  implements IPlatformService {
  @Inject() protected hostsService: HostsService;
  @Inject() protected userService: UserService;
  @Inject() private streamSettingsService: StreamSettingsService;

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

  static initialState = initialState;

  protected init() {
    // save settings to the local storage
    const savedSettings: IFacebookStartStreamOptions = JSON.parse(
      localStorage.getItem(this.serviceName) as string,
    );
    if (savedSettings) this.SET_STREAM_SETTINGS({ ...initialState.settings, ...savedSettings });
    this.store.watch(
      () => this.state.settings,
      () => {
        const { title, description, game, pageId } = this.state.settings;
        localStorage.setItem(
          this.serviceName,
          JSON.stringify({ title, description, game, pageId }),
        );
      },
      { deep: true },
    );
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
    this.state.settings = { title, description, game, pageId: facebookPageId };
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
    // TODO:
    return '';
    // return this.state.activePage?.access_token;
  }

  get streamPageUrl(): string {
    // TODO:
    return '';

    // if (!this.state.activePage) return '';
    // const pathToPage = `${this.state.activePage.name}-${this.state.activePage.id}`.replace(
    //   ' ',
    //   '-',
    // );
    // return `https://www.facebook.com/${pathToPage}/live_videos`;
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
    // await this.fetchPages();
    // return this.requestFacebook<{ data: IFacebookPage[] }>(`${this.apiBase}/me/accounts`).then(
    //   async json => {
    //     const pageId = this.userService.platform?.channelId || this.state.facebookPages?.page_id!;
    //     const activePage = json.data.filter(page => pageId === page.id)[0] || json.data[0];
    //     this.userService.updatePlatformChannelId('facebook', pageId);
    //     this.SET_ACTIVE_PAGE(activePage);
    //   },
    // );
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

  private createLiveVideo(options: IFacebookStartStreamOptions): Promise<IFacebookLiveVideo> {
    const { title, description, game, pageId } = options;
    const data = {
      method: 'POST',
      body: JSON.stringify({ title, description, game_specs: { name: game } }),
    };
    return this.requestFacebook<IFacebookLiveVideo>(
      {
        url: `${this.apiBase}/${pageId}/live_videos`,
        ...data,
      },
      this.activeToken,
    );
  }

  /**
   * fetch prefill data
   */
  async prepopulateInfo() {
    // no prefill data needed for FB
    // we already have taken all data from local storage

    // /me/accounts

    this.fetchPages();
    this.SET_PREPOPULATED(true);
  }

  async scheduleStream(
    scheduledStartTime: string,
    { title, description, game }: IFacebookChannelInfo,
  ): Promise<any> {
    // const url = `${this.apiBase}/${this.state.activePage!.id}/live_videos`;
    // const body = JSON.stringify({
    //   title,
    //   description,
    //   planned_start_time: new Date(scheduledStartTime).getTime() / 1000,
    //   game_specs: { name: game },
    //   status: 'SCHEDULED_UNPUBLISHED',
    // });
    // try {
    //   return await platformRequest('facebook', { url, body, method: 'POST' }, this.activeToken);
    // } catch (e) {
    //   if (e?.result?.error?.code === 100) {
    //     throw new Error(
    //       $t(
    //         'Please schedule no further than 7 days in advance and no sooner than 10 minutes in advance.',
    //       ),
    //     );
    //   }
    // }
  }

  async fetchScheduledVideos(pageId: string): Promise<IFacebookLiveVideo[]> {
    return (
      await this.requestFacebook<{ data: IFacebookLiveVideo[] }>(
        `${this.apiBase}/${pageId}/live_videos?broadcast_status=["SCHEDULED_UNPUBLISHED"]&fields=title,description,planned_start_time&source=owner`,
      )
    ).data;
  }

  async fetchGroups(): Promise<[]> {
    return [];
  }

  fetchViewerCount(): Promise<number> {
    if (this.state.settings.liveVideoId == null) return Promise.resolve(0);

    const url = `${this.apiBase}/${this.state.settings.liveVideoId}?fields=live_views`;

    return this.requestFacebook<{ live_views: number }>(url, this.activeToken)
      .then(json => json.live_views)
      .catch(() => 0);
  }

  async beforeGoLive(options: IGoLiveSettings) {
    const fbOptions = options.platforms.facebook;

    if (fbOptions.liveVideoId) {
      // TODO:
      throw new Error('not implemented');
    }

    const liveVideo = await this.createLiveVideo(fbOptions);
    const streamUrl = liveVideo.stream_url;
    const streamKey = streamUrl.substr(this.state.streamUrl.lastIndexOf('/') + 1);

    this.streamSettingsService.setSettings({ platform: 'facebook', streamType: 'rtmp_common' });
    this.streamSettingsService.setSettings({
      key: streamKey,
      platform: 'facebook',
      streamType: 'rtmp_common',
    });

    this.SET_STREAM_KEY(streamKey);
  }

  /**
   * update data for the current active broadcast
   */
  async putChannelInfo(info: IFacebookStartStreamOptions): Promise<void> {
    return Promise.resolve();
    // const { title, description, game } = info;
    // let facebookPageId = info.destinationId;
    // this.SET_STREAM_PROPERTIES(title, description, game, facebookPageId);
    // // take fist page if no pages provided
    // assertIsDefined(this.state.facebookPages);
    // if (!facebookPageId) facebookPageId = this.state.facebookPages.pages[0].id;
    // assertIsDefined(facebookPageId);
    // await this.postPage(facebookPageId);
    // if (this.state.liveVideoId && game) {
    //   return this.requestFacebook(
    //     {
    //       url: `${this.apiBase}/${this.state.liveVideoId}`,
    //       method: 'POST',
    //       body: JSON.stringify({ title, description, game_specs: { name: game } }),
    //     },
    //     this.state.activePage!.access_token,
    //   ).then(() => true);
    // }
    // return Promise.resolve(true);
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

  fetchPages(): Promise<IStreamlabsFacebookPages> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/user/facebook/pages`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers });
    return fetch(request).then(handleResponse);
  }

  // private postPage(pageId: string) {
  //   const host = this.hostsService.streamlabs;
  //   const url = `https://${host}/api/v5/slobs/user/facebook/pages`;
  //   const headers = authorizedHeaders(this.userService.apiToken!);
  //   headers.append('Content-Type', 'application/json');
  //   const request = new Request(url, {
  //     headers,
  //     method: 'POST',
  //     body: JSON.stringify({ page_id: pageId, page_type: 'page' }),
  //   });
  //   try {
  //     fetch(request).then(() => this.userService.updatePlatformChannelId('facebook', pageId));
  //   } catch {
  //     console.error(new Error('Could not set Facebook page'));
  //   }
  // }

  // sendPushNotif() {
  //   const url = 'https://streamlabs.com/api/v5/slobs/remote/notify';
  //   if (!this.userService.apiToken) {
  //     throw new Error('API token must be defined');
  //   }
  //   const headers = authorizedHeaders(
  //     this.userService.apiToken,
  //     new Headers({
  //       'Content-Type': 'application/json',
  //     }),
  //   );
  //   const postData = {
  //     headers,
  //     method: 'POST',
  //     body: '',
  //   };
  //   const req = new Request(url, postData);
  //   fetch(req);
  // }
}
