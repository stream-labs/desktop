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
  category: string;
  category_list: { id: string; name: string }[];
  tasks: 'ANALYZE' | 'ADVERTISE' | 'MODERATE' | 'CREATE_CONTENT' | 'MANAGE';
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

interface IFacebookServiceState extends IPlatformState {
  facebookPages: IFacebookPage[];
  settings: IFacebookStartStreamOptions;
}

export interface IFacebookStartStreamOptions {
  title: string;
  game?: string;
  destinationType: 'me' | 'page' | 'group';
  destinationId: string;
  description?: string;
  liveVideoId?: string;
}

export interface IFacebookUpdateVideoOptions extends IFacebookStartStreamOptions {
  liveVideoId: string;
}

export interface IFacebookChannelInfo extends IFacebookStartStreamOptions {
  chatUrl: string;
  streamUrl: string;
}

const initialState: IFacebookServiceState = {
  ...BasePlatformService.initialState,
  facebookPages: [],
  settings: {
    destinationType: 'page',
    destinationId: '',
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
    if (savedSettings) this.UPDATE_STREAM_SETTINGS(savedSettings);
    this.store.watch(
      () => this.state.settings,
      () => {
        const { title, description, game, destinationType, destinationId } = this.state.settings;
        localStorage.setItem(
          this.serviceName,
          JSON.stringify({ title, description, game, destinationType, destinationId }),
        );
      },
      { deep: true },
    );
  }

  @mutation()
  private SET_FACEBOOK_PAGES(pages: IFacebookPage[]) {
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

  async beforeGoLive(options: IGoLiveSettings) {
    const fbOptions = options.platforms.facebook;
    const liveVideo = fbOptions.liveVideoId
      ? await this.updateLiveVideo(fbOptions as IFacebookUpdateVideoOptions)
      : await this.createLiveVideo(fbOptions);

    const streamUrl = liveVideo.stream_url;
    const streamKey = streamUrl.substr(streamUrl.lastIndexOf('/') + 1);

    this.streamSettingsService.setSettings({
      key: streamKey,
      platform: 'facebook',
      streamType: 'rtmp_common',
    });

    this.SET_STREAM_KEY(streamKey);
    this.UPDATE_STREAM_SETTINGS({ ...fbOptions, liveVideoId: liveVideo.id });
  }

  /**
   * update data for the current active video
   */
  async putChannelInfo(info: IFacebookUpdateVideoOptions): Promise<void> {
    await this.updateLiveVideo(info);
    this.UPDATE_STREAM_SETTINGS(info);
  }

  /**
   * update live video
   */
  private async updateLiveVideo(options: IFacebookUpdateVideoOptions): Promise<IFacebookLiveVideo> {
    const { title, description, game, liveVideoId, destinationId } = options;
    const data: Dictionary<any> = { title, description };
    const token = this.getPage(destinationId).access_token;
    if (game) data.game_specs = { name: game };

    return await this.requestFacebook(
      {
        url: `${this.apiBase}/${liveVideoId}?fields=title,description,stream_url`,
        method: 'POST',
        body: JSON.stringify(data),
      },
      token,
    );
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
    const { title, description, game, destinationType } = options;
    const data = {
      method: 'POST',
      body: JSON.stringify({ title, description, game_specs: { name: game } }),
    };

    const destinationId = destinationType === 'me' ? 'me' : options.destinationId;
    const token =
      destinationType === 'me' ? this.oauthToken : this.getPage(destinationId).access_token;

    return this.requestFacebook<IFacebookLiveVideo>(
      {
        url: `${this.apiBase}/${destinationId}/live_videos`,
        ...data,
      },
      token,
    );
  }

  /**
   * fetch prefill data
   */
  async prepopulateInfo() {
    this.SET_FACEBOOK_PAGES(await this.fetchPages());
    const pageId = this.state.settings.destinationId;
    const page = this.getPage(pageId);
    if (!page) this.UPDATE_STREAM_SETTINGS({ destinationId: this.state.facebookPages[0].id });
    this.SET_PREPOPULATED(true);
  }

  private getPage(id: string): IFacebookPage {
    return this.state.facebookPages.find(p => p.id === id);
  }

  async scheduleStream(
    scheduledStartTime: string,
    { title, description, game, destinationId }: IFacebookChannelInfo,
  ): Promise<any> {
    const url = `${this.apiBase}/${destinationId}/live_videos`;
    const data: Dictionary<any> = {
      title,
      description,
      planned_start_time: new Date(scheduledStartTime).getTime() / 1000,
      status: 'SCHEDULED_UNPUBLISHED',
    };
    if (game) data.game_specs = { name: game };
    const body = JSON.stringify(data);
    const token = this.getPage(destinationId).access_token;
    try {
      return await platformRequest('facebook', { url, body, method: 'POST' }, token);
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

  async fetchScheduledVideos(pageId: string): Promise<IFacebookLiveVideo[]> {
    const timeRange = 1000 * 60 * 60 * 24;
    const maxDate = Date.now() + timeRange;
    const minDate = Date.now() - timeRange;
    return (
      await this.requestFacebook<{ data: IFacebookLiveVideo[] }>(
        `${this.apiBase}/${pageId}/live_videos?broadcast_status=["SCHEDULED_UNPUBLISHED"]&fields=title,description,planned_start_time&source=owner&since=${minDate}&until=${maxDate}`,
      )
    ).data;
  }

  async fetchGroups(): Promise<unknown> {
    return (
      await this.requestFacebook<{ data: IFacebookPage[] }>(
        `${this.apiBase}/me/groups?admin_only=true&limit=100`,
      )
    ).data;
  }

  fetchViewerCount(): Promise<number> {
    const { liveVideoId, destinationId } = this.state.settings;
    if (liveVideoId == null) return Promise.resolve(0);

    const url = `${this.apiBase}/${this.state.settings.liveVideoId}?fields=live_views`;
    const pageToken = this.getPage(destinationId).access_token;

    return this.requestFacebook<{ live_views: number }>(url, pageToken)
      .then(json => json.live_views)
      .catch(() => 0);
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

  get liveDockEnabled(): boolean {
    return true;
  }

  private async fetchPages(): Promise<IFacebookPage[]> {
    return (await this.requestFacebook<{ data: IFacebookPage[] }>(`${this.apiBase}/me/accounts`))
      .data;
  }

  // fetchPages(): Promise<IStreamlabsFacebookPages> {
  //   const host = this.hostsService.streamlabs;
  //   const url = `https://${host}/api/v5/slobs/user/facebook/pages`;
  //   const headers = authorizedHeaders(this.userService.apiToken!);
  //   const request = new Request(url, { headers });
  //   return fetch(request).then(handleResponse);
  // }

  // private postPage(destinationId: string) {
  //   const host = this.hostsService.streamlabs;
  //   const url = `https://${host}/api/v5/slobs/user/facebook/pages`;
  //   const headers = authorizedHeaders(this.userService.apiToken!);
  //   headers.append('Content-Type', 'application/json');
  //   const request = new Request(url, {
  //     headers,
  //     method: 'POST',
  //     body: JSON.stringify({ page_id: destinationId, page_type: 'page' }),
  //   });
  //   try {
  //     fetch(request).then(() => this.userService.updatePlatformChannelId('facebook', destinationId));
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
