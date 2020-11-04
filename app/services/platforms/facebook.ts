import { mutation, InheritMutations, ViewHandler } from '../core/stateful-service';
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
import { authorizedHeaders, jfetch } from 'util/requests';
import { UserService } from 'services/user';
import { platformAuthorizedRequest, platformRequest } from './utils';
import { $t } from 'services/i18n';
import { StreamSettingsService } from 'services/settings/streaming';
import { IGoLiveSettings } from 'services/streaming';
import { throwStreamError } from 'services/streaming/stream-error';
import { BasePlatformService } from './base-platform';
import electron from 'electron';
import { WindowsService } from '../windows';

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
  permalink_url: string;
}

interface IFacebookServiceState extends IPlatformState {
  facebookPages: IFacebookPage[];
  facebookGroups: IFacebookGroup[];
  settings: IFacebookStartStreamOptions;
  grantedPermissions: TFacebookPermissionName[];
  streamPageUrl: string;
  userAvatar: string;
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
  streamPageUrl: '',
  userAvatar: '',
  settings: {
    destinationType: 'page',
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
  @Inject() private windowsService: WindowsService;

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

  get views() {
    return new FacebookView(this.state);
  }

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

  @mutation()
  private SET_STREAM_PAGE_URL(url: string) {
    this.state.streamPageUrl = url;
  }

  @mutation()
  protected SET_AVATAR(avatar: string) {
    this.state.userAvatar = avatar;
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
    return this.state.streamPageUrl;
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
    this.SET_STREAM_PAGE_URL(`https://facebook.com/${liveVideo.permalink_url}`);
    this.UPDATE_STREAM_SETTINGS({ ...fbOptions, liveVideoId: liveVideo.id });
  }

  /**
   * update data for the current active video
   */
  async putChannelInfo(info: IFacebookUpdateVideoOptions): Promise<void> {
    const vidId = this.state.settings.liveVideoId;
    await this.updateLiveVideo(vidId, info);
    this.UPDATE_STREAM_SETTINGS({ ...info, liveVideoId: vidId });
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
    const destinationId = this.views.getDestinationId(options);
    const token = this.views.getDestinationToken(options.destinationType, destinationId);

    return await this.requestFacebook(
      {
        url: `${this.apiBase}/${liveVideoId}?fields=title,description,stream_url,planned_start_time,permalink_url`,
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
    const destinationId = this.views.getDestinationId(options);
    const token = this.views.getDestinationToken(options.destinationType, destinationId);
    const body: Dictionary<any> = { title, description };
    if (game) body.game_specs = { name: game };

    return this.requestFacebook<IFacebookLiveVideo>(
      {
        url: `${this.apiBase}/${destinationId}/live_videos?&fields=title,description,planned_start_time,permalink_url,stream_url,dash_preview_url`,
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
      const page = this.views.getPage(pageId);
      if (!page) this.UPDATE_STREAM_SETTINGS({ pageId: this.state.facebookPages[0].id });
    } else {
      this.UPDATE_STREAM_SETTINGS({ pageId: '' });
    }

    // if currently selected group is not in the group list then select the first group
    if (groups.length) {
      const groupId = this.state.settings.groupId;
      const group = this.views.getGroup(groupId);
      if (!group) this.UPDATE_STREAM_SETTINGS({ groupId: this.state.facebookGroups[0].id });
    } else {
      this.UPDATE_STREAM_SETTINGS({ groupId: '' });
    }

    // if the user doesn't have groups and pages than set destinationType to the user's timeline
    if (!this.state.settings.pageId && !this.state.settings.groupId) {
      this.UPDATE_STREAM_SETTINGS({ destinationType: 'me' });
    }

    if (!this.state.userAvatar) {
      this.SET_AVATAR(await this.fetchPicture('me'));
    }

    this.SET_PREPOPULATED(true);
  }

  async scheduleStream(
    scheduledStartTime: string,
    options: IFacebookStartStreamOptions,
  ): Promise<any> {
    const { title, description, game } = options;
    const destinationId = this.views.getDestinationId(options);
    const token = this.views.getDestinationToken(options.destinationType, destinationId);
    const url = `${this.apiBase}/${destinationId}/live_videos`;
    const data: Dictionary<any> = {
      title,
      description,
      planned_start_time: new Date(scheduledStartTime).getTime() / 1000,
      status: 'SCHEDULED_UNPUBLISHED',
    };
    if (game) data.game_specs = { name: game };
    const body = JSON.stringify(data);

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
    const token = this.views.getDestinationToken(destinationType, destinationId);
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
    const pageToken = this.views.getPage(pageId).access_token;

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
    if (this.state.settings.destinationType === 'page' && this.state.settings.game) {
      return 'https://www.facebook.com/gaming/streamer/chat/';
    } else {
      const token = this.views.getDestinationToken(
        this.state.settings.destinationType,
        this.state.settings.pageId,
      );
      return `https://streamlabs.com/embed/chat?oauth_token=${this.userService.apiToken}&fbVideoId=${this.state.settings.liveVideoId}&fbToken=${token}`;
    }
  }

  get liveDockEnabled(): boolean {
    return true;
  }

  createFBPage() {
    electron.remote.shell.openExternal(
      'https://www.facebook.com/gaming/pages/create?ref=streamlabs',
    );
    this.windowsService.actions.closeChildWindow();
  }

  private async fetchPages(): Promise<IFacebookPage[]> {
    return (
      await this.requestFacebook<{ data: IFacebookPage[] }>(
        `${this.apiBase}/me/accounts`,
        this.oauthToken,
      )
    ).data;
  }
}

export class FacebookView extends ViewHandler<IFacebookServiceState> {
  private get userView() {
    return this.getServiceViews(UserService);
  }

  private get oauthToken() {
    return this.userView.state.auth?.platforms?.facebook?.token;
  }

  getPage(id: string): IFacebookPage {
    return this.state.facebookPages.find(p => p.id === id);
  }

  getGroup(id: string): IFacebookGroup {
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

  getDestinationToken(destinationType?: TDestinationType, destinationId?: string): string {
    destinationType = destinationType || this.state.settings.destinationType;
    destinationId = destinationId || this.getDestinationId(this.state.settings);
    switch (destinationType) {
      case 'me':
      case 'group':
        return this.oauthToken;
      case 'page':
        return this.getPage(destinationId).access_token;
    }
  }
}
