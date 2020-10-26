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
import { UserService } from 'services/user';
import { platformAuthorizedRequest, platformRequest } from './utils';
import { $t } from 'services/i18n';
import { StreamSettingsService } from 'services/settings/streaming';
import { IGoLiveSettings } from 'services/streaming';
import { throwStreamError } from 'services/streaming/stream-error';
import { BasePlatformService } from './base-platform';
import { IYoutubeStartStreamOptions } from './youtube';

interface IFacebookPage {
  access_token: string;
  name: string;
  id: string;
  category: string;
  category_list: { id: string; name: string }[];
  tasks: 'ANALYZE' | 'ADVERTISE' | 'MODERATE' | 'CREATE_CONTENT' | 'MANAGE';
}

interface IFacebookGroup {
  id: string;
  name: string;
  privacy: 'CLOSED' | 'OPEN' | 'SECRET';
}

export interface IFacebookLiveVideo {
  status: 'SCHEDULED_UNPUBLISHED' | 'LIVE_STOPPED' | 'LIVE';
  planned_start_time: string;
  id: string;
  stream_url: string;
  title: string;
  game: string;
  description: string;
}

interface IFacebookServiceState extends IPlatformState {
  facebookPages: IFacebookPage[];
  facebookGroups: IFacebookGroup[];
  settings: IFacebookStartStreamOptions;
  grantedPermissions: TFacebookPermissionName[];
}

export interface IFacebookStartStreamOptions {
  title: string;
  game?: string;
  destinationType: TDestinationType;
  pageId?: string;
  groupId?: string;
  description?: string;
  liveVideoId?: string;
}

export type TDestinationType = 'me' | 'page' | 'group' | '';

export interface IFacebookUpdateVideoOptions extends IFacebookStartStreamOptions {
  liveVideoId: string;
}

const initialState: IFacebookServiceState = {
  ...BasePlatformService.initialState,
  facebookPages: [],
  facebookGroups: [],
  grantedPermissions: [],
  settings: {
    destinationType: '',
    pageId: '',
    groupId: '',
    liveVideoId: '',
    title: '',
    description: '',
    game: '',
  },
};

type TFacebookPermissionName = 'publish_video' | 'publish_to_groups';
type TFacebookPermission = { permission: TFacebookPermissionName; status: 'granted' | string };

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
    // pick up settings from the local storage and start syncing them
    this.syncSettingsWithLocalStorage();

    // migrate user from SLOBS version that could stream only on a FB page
    const shouldMigrate = !this.state.settings.destinationType && this.state.settings.pageId;
    if (shouldMigrate) {
      // stream to a FB page by default for migrated users
      this.UPDATE_STREAM_SETTINGS({ destinationType: 'page' });
    } else {
      // stream to a user personal page by default for new users
      this.UPDATE_STREAM_SETTINGS({ destinationType: 'me' });
    }
  }

  @mutation()
  private SET_FACEBOOK_PAGES_AND_GROUPS(pages: IFacebookPage[], groups: IFacebookGroup[]) {
    this.state.facebookPages = pages;
    this.state.facebookGroups = groups;
  }

  @mutation()
  private SET_PERMISSIONS(permissions: TFacebookPermissionName[]) {
    this.state.grantedPermissions = permissions;
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
    const settings = this.state.settings;
    if (settings.destinationType === 'page') {
      const page = this.getPage(settings.pageId);
      if (!page) return '';
      const pathToPage = `${page.name}-${page.id}`.replace(' ', '-');
      return `https://www.facebook.com/${pathToPage}/live_videos`;
    } else if (settings.destinationType === 'me') {
      const user = this.userService.state.auth?.platforms?.facebook;
      if (!user) return '';
      return `https://www.facebook.com/${user.username}`;
    } else if (settings.destinationType === 'group') {
      const group = this.getGroup(settings.groupId);
      if (!group) return '';
      return `https://www.facebook.com/groups/${group.name}`;
    }
  }

  async beforeGoLive(options: IGoLiveSettings) {
    const fbOptions = options.platforms.facebook;
    let liveVideo: IFacebookLiveVideo;
    if (fbOptions.liveVideoId) {
      liveVideo = await this.updateLiveVideo(
        fbOptions.liveVideoId,
        fbOptions as IFacebookUpdateVideoOptions,
        true,
      );
    } else {
      liveVideo = await this.createLiveVideo(fbOptions);
    }

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
    await this.updateLiveVideo(this.state.settings.liveVideoId, info);
    this.UPDATE_STREAM_SETTINGS(info);
  }

  /**
   * update live video
   */
  private async updateLiveVideo(
    liveVideoId: string,
    options: IFacebookUpdateVideoOptions,
    switchToLive = false,
  ): Promise<IFacebookLiveVideo> {
    const { title, description, game } = options;
    const data: Dictionary<any> = { title, description };
    if (game) data.game_specs = { name: game };
    if (switchToLive) {
      data.status = 'LIVE_NOW';
    }
    const destinationId = this.getDestinationId(options);
    const token = this.getDestinationToken(options.destinationType, destinationId);

    return await this.requestFacebook(
      {
        url: `${this.apiBase}/${liveVideoId}?fields=title,description,stream_url`,
        method: 'POST',
        body: JSON.stringify(data),
      },
      token,
    );
  }

  async validatePlatform() {
    const permissions = await this.fetchPermissions();
    const grantedPermissions = permissions
      .filter(p => ['publish_video', 'publish_to_groups'].includes(p.permission))
      .filter(p => p.status === 'granted')
      .map(p => p.permission);
    this.SET_PERMISSIONS(grantedPermissions);
    return EPlatformCallResult.Success;
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

  private async fetchPermissions(): Promise<TFacebookPermission[]> {
    const permissionsResponse = await this.requestFacebook<{ data: TFacebookPermission[] }>(
      `${this.apiBase}/me/permissions`,
      this.oauthToken,
    );
    return permissionsResponse.data;
  }

  /**
   * Request Facebook API and wrap failed response to a unified error model
   */
  async requestFacebook<T = unknown>(
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

  /**
   * Download the picture of a group or page and return it's base64 url string
   */
  async fetchPicture(objectId: string): Promise<string> {
    let url = '';
    try {
      await fetch(`${this.apiBase}/${objectId}/picture`, {
        method: 'GET',
        headers: new Headers({
          Authorization: 'Bearer ' + this.oauthToken,
        }),
      })
        .then(response => response.blob())
        .then(blob => {
          url = window.URL.createObjectURL(blob);
        });
    } catch (e) {
      // just don't care is something is wrong here
    }
    return url;
  }

  private createLiveVideo(options: IFacebookStartStreamOptions): Promise<IFacebookLiveVideo> {
    const { title, description, game } = options;
    const destinationId = this.getDestinationId(options);
    const token = this.getDestinationToken(options.destinationType, destinationId);
    const body: Dictionary<any> = { title, description };
    if (game) body.game_specs = { name: game };

    return this.requestFacebook<IFacebookLiveVideo>(
      {
        url: `${this.apiBase}/${destinationId}/live_videos`,
        method: 'POST',
        body: JSON.stringify(body),
      },
      token,
    );
  }

  /**
   * fetch prefill data and set default values
   */
  async prepopulateInfo() {
    // fetch pages and groups
    const [pages, groups] = ((await Promise.all([
      this.fetchPages(),
      this.fetchGroups(),
    ])) as unknown) as [IFacebookPage[], IFacebookGroup[]];
    this.SET_FACEBOOK_PAGES_AND_GROUPS(pages, groups);

    // if currently selected page is not in the pages list then select the first page
    if (pages.length) {
      const pageId = this.state.settings.pageId;
      const page = this.getPage(pageId);
      if (!page) this.UPDATE_STREAM_SETTINGS({ pageId: this.state.facebookPages[0].id });
    } else {
      this.UPDATE_STREAM_SETTINGS({ pageId: '' });
    }

    // if currently selected group is not in the group list then select the first group
    if (groups.length) {
      const groupId = this.state.settings.groupId;
      const group = this.getGroup(groupId);
      if (!group) this.UPDATE_STREAM_SETTINGS({ groupId: this.state.facebookGroups[0].id });
    } else {
      this.UPDATE_STREAM_SETTINGS({ groupId: '' });
    }

    this.SET_PREPOPULATED(true);
  }

  private getPage(id: string): IFacebookPage {
    return this.state.facebookPages.find(p => p.id === id);
  }

  private getGroup(id: string): IFacebookGroup {
    return this.state.facebookGroups.find(g => g.id === id);
  }

  getDestinationId(options: IFacebookStartStreamOptions) {
    switch (options.destinationType) {
      case 'me':
        return 'me';
      case 'page':
        return options.pageId;
      case 'group':
        return options.groupId;
    }
  }

  getDestinationToken(destinationType: TDestinationType, destinationId: string): string {
    switch (destinationType) {
      case 'me':
      case 'group':
        return this.oauthToken;
      case 'page':
        return this.getPage(destinationId).access_token;
    }
  }

  async scheduleStream(
    scheduledStartTime: string,
    options: IFacebookStartStreamOptions,
  ): Promise<any> {
    const { title, description, game } = options;
    const destinationId = this.getDestinationId(options);
    const token = this.getDestinationToken(options.destinationType, destinationId);
    const url = `${this.apiBase}/${destinationId}/live_videos`;
    const data: Dictionary<any> = {
      title,
      description,
      planned_start_time: new Date(scheduledStartTime).getTime() / 1000,
      status: 'SCHEDULED_UNPUBLISHED',
    };
    if (game) data.game_specs = { name: game };
    const body = JSON.stringify(data);

    console.log('schedule stream for  ', options.destinationType);
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

  async fetchScheduledVideos(
    destinationType: TDestinationType,
    destinationId: string,
  ): Promise<IFacebookLiveVideo[]> {
    const timeRange = 1000 * 60 * 60 * 24;
    const maxDate = Date.now() + timeRange;
    const minDate = Date.now() - timeRange;
    const maxDateUnix = Math.floor(maxDate / 1000);
    const minDateUnix = Math.floor(minDate / 1000);
    const token = this.getDestinationToken(destinationType, destinationId);
    let sourceParam = '';
    if (destinationType === 'page' || destinationType === 'me') {
      sourceParam = '&source=owner';
    } else {
      sourceParam = '&source=target';
    }

    const videos = (
      await this.requestFacebook<{ data: IFacebookLiveVideo[] }>(
        `${this.apiBase}/${destinationId}/live_videos?broadcast_status=["SCHEDULED_UNPUBLISHED"]&fields=title,description,planned_start_time,permalink_url,from${sourceParam}&since=${minDateUnix}&until=${maxDateUnix}`,
        token,
      )
    ).data;

    // the FB filter doesn't work for some livevideos,
    // filter manually here
    return videos.filter(v => {
      const videoDate = new Date(v.planned_start_time).valueOf();
      return videoDate >= minDate && videoDate <= maxDate;
    });
  }

  async fetchGroups(): Promise<IFacebookPage[]> {
    return (
      await this.requestFacebook<{ data: IFacebookPage[] }>(
        `${this.apiBase}/me/groups?admin_only=true&fields=id,name,icon,privacy&limit=100`,
      )
    ).data;
  }

  fetchViewerCount(): Promise<number> {
    const { liveVideoId, pageId } = this.state.settings;
    if (liveVideoId == null) return Promise.resolve(0);

    const url = `${this.apiBase}/${this.state.settings.liveVideoId}?fields=live_views`;
    const pageToken = this.getPage(pageId).access_token;

    return this.requestFacebook<{ live_views: number }>(url, pageToken)
      .then(json => json.live_views)
      .catch(() => 0);
  }

  async searchGames(searchString: string): Promise<IGame[]> {
    if (searchString.length < 2) return [];
    const gamesResponse = await this.requestFacebook<{ data: { name: string; id: string }[] }>(
      `${this.apiBase}/v3.2/search?type=game&q=${searchString}`,
    );
    return gamesResponse.data.slice(0, 15).map(g => ({ id: g.id, name: g.name }));
  }

  get chatUrl(): string {
    return 'https://www.facebook.com/gaming/streamer/chat/';
  }

  get liveDockEnabled(): boolean {
    return true;
  }

  private async fetchPages(): Promise<IFacebookPage[]> {
    return (
      await this.requestFacebook<{ data: IFacebookPage[] }>(
        `${this.apiBase}/me/accounts`,
        this.oauthToken,
      )
    ).data;
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
