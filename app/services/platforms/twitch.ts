import {
  EPlatformCallResult,
  IGame,
  IPlatformRequest,
  IPlatformService,
  IPlatformState,
  TPlatformCapability,
} from '.';
import { HostsService } from 'services/hosts';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, handleResponse, jfetch } from 'util/requests';
import { UserService } from 'services/user';
import { getAllTags, getStreamTags, TTwitchTag, updateTags } from './twitch/tags';
import { TTwitchOAuthScope } from './twitch/scopes';
import { platformAuthorizedRequest, platformRequest } from './utils';
import { StreamSettingsService } from 'services/settings/streaming';
import { CustomizationService } from 'services/customization';
import { assertIsDefined } from 'util/properties-type-guards';
import { IGoLiveSettings } from 'services/streaming';
import { InheritMutations, mutation } from 'services/core';
import { throwStreamError } from 'services/streaming/stream-error';
import { BasePlatformService } from './base-platform';

export interface ITwitchStartStreamOptions {
  title: string;
  game?: string;
  tags?: TTwitchTag[];
}

export interface ITwitchChannelInfo extends ITwitchStartStreamOptions {
  hasUpdateTagsPermission: boolean;
  availableTags: TTwitchTag[];
}

interface ITWitchChannelResponse {
  status: string;
  game: string;
  stream_key: string;
}

/**
 * Request headers that need to be sent to Twitch
 */
export interface ITwitchRequestHeaders extends Dictionary<string | undefined> {
  Accept: 'application/vnd.twitchtv.v5+json';
  Authorization?: string;
  'Client-Id': string;
  'Content-Type': 'application/json';
}

/**
 * Result of a token validation response, which returns information including
 * the list of authorized scopes.
 */
interface ITwitchOAuthValidateResponse {
  clientId: string;
  login: string;
  scopes: string[];
  user_id: string;
}

interface ITwitchServiceState extends IPlatformState {
  hasUpdateTagsPermission: boolean;
  availableTags: TTwitchTag[];
  settings: ITwitchStartStreamOptions;
}

@InheritMutations()
export class TwitchService extends BasePlatformService<ITwitchServiceState>
  implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() streamSettingsService: StreamSettingsService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  static initialState: ITwitchServiceState = {
    ...BasePlatformService.initialState,
    hasUpdateTagsPermission: false,
    availableTags: [],
    settings: {
      title: '',
      game: '',
      tags: [],
    },
  };

  readonly platform = 'twitch';
  readonly displayName = 'Twitch';

  readonly capabilities = new Set<TPlatformCapability>([
    'chat',
    'scope-validation',
    'tags',
    'game',
    'user-info',
  ]);

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 600,
    height: 800,
  };

  // Streamlabs Production Twitch OAuth Client ID
  clientId = '8bmp6j83z5w4mepq0dn0q1a7g186azi';

  init() {
    // prepopulate data to make chat available after app start
    this.userService.userLogin.subscribe(_ => {
      if (this.userService.platform?.type === 'twitch') this.prepopulateInfo();
    });
  }

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const scopes: TTwitchOAuthScope[] = ['channel_read', 'channel_editor', 'user:edit:broadcast'];

    const query =
      `_=${Date.now()}&skip_splash=true&external=electron&twitch&force_verify&` +
      `scope=${scopes.join(',')}&origin=slobs`;

    return `https://${host}/slobs/login?${query}`;
  }

  // TODO: Refactor so this is reusable
  get userAuth(): { token?: string; id?: string } {
    return {
      token: this.userService.state.auth?.platforms?.twitch?.token,
      id: this.userService.state.auth?.platforms?.twitch?.id,
    };
  }

  get oauthToken() {
    return this.userAuth.token;
  }

  get twitchId() {
    return this.userAuth.id;
  }

  get username(): string {
    return this.userService.state.auth?.platforms?.twitch?.username || '';
  }

  async beforeGoLive(goLiveSettings?: IGoLiveSettings) {
    if (
      this.streamSettingsService.protectedModeEnabled &&
      this.streamSettingsService.isSafeToModifyStreamKey()
    ) {
      const key = await this.fetchStreamKey();
      this.SET_STREAM_KEY(key);
      this.streamSettingsService.setSettings({
        key,
        platform: 'twitch',
        streamType: 'rtmp_common',
      });
    }

    if (goLiveSettings) {
      const channelInfo = goLiveSettings?.platforms.twitch;
      if (channelInfo) await this.putChannelInfo(channelInfo);
    }
  }

  async validatePlatform() {
    const hasScopeCheck = this.hasScope('channel_read')
      .then(result => {
        if (!result) return EPlatformCallResult.TwitchScopeMissing;
        return EPlatformCallResult.Success;
      })
      .catch(e => {
        console.error('Error checking Twitch OAuth scopes', e);
        return EPlatformCallResult.Error;
      });

    const twitchTwoFactorCheck = this.fetchStreamKey()
      .then(key => {
        return EPlatformCallResult.Success;
      })
      .catch(e => {
        if (e && e.status) {
          if (e.status === 403) {
            return EPlatformCallResult.TwitchTwoFactor;
          }
        }
        console.error('Error fetching Twitch stream key', e);
        return EPlatformCallResult.Error;
      });

    const results = await Promise.all([hasScopeCheck, twitchTwoFactorCheck]);
    const failedResults = results.filter(result => result !== EPlatformCallResult.Success);
    if (failedResults.length) return failedResults[0];
    return EPlatformCallResult.Success;
  }

  fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/twitch/refresh`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers });

    return jfetch<{ access_token: string }>(request).then(response =>
      this.userService.updatePlatformToken('twitch', response.access_token),
    );
  }

  /**
   * Request Twitch API and wrap failed response to a unified error model
   */
  async requestTwitch<T = unknown>(reqInfo: IPlatformRequest | string): Promise<T> {
    try {
      return await platformAuthorizedRequest<T>('twitch', reqInfo);
    } catch (e) {
      const details = e.result
        ? `${e.result.status} ${e.result.error} ${e.result.message}`
        : 'Connection failed';
      const errorType =
        e.result?.message === 'missing required oauth scope'
          ? 'TWITCH_MISSED_OAUTH_SCOPE'
          : 'PLATFORM_REQUEST_FAILED';
      throwStreamError(errorType, details, 'twitch');
    }
  }

  private fetchRawChannelInfo(): Promise<ITWitchChannelResponse> {
    return this.requestTwitch<ITWitchChannelResponse>('https://api.twitch.tv/kraken/channel');
  }

  fetchStreamKey(): Promise<string> {
    return this.fetchRawChannelInfo().then(json => json.stream_key);
  }

  /**
   * prepopulate channel info and save it to the store
   */
  async prepopulateInfo(): Promise<void> {
    const [channelInfo, hasUpdateTagsPermission] = await Promise.all([
      this.fetchRawChannelInfo().then(json => ({
        title: json.status,
        game: json.game,
      })),
      this.getHasUpdateTagsPermission(),
    ]);

    let tags: TTwitchTag[] = [];
    if (hasUpdateTagsPermission) {
      [tags] = await Promise.all([this.getStreamTags(), this.getAllTags()]);
    }
    this.SET_PREPOPULATED(true);
    this.SET_STREAM_SETTINGS({ tags, title: channelInfo.title, game: channelInfo.game });
  }

  @mutation()
  private SET_AVAILABLE_TAGS(tags: TTwitchTag[]) {
    this.state.availableTags = tags;
    this.state.hasUpdateTagsPermission = true;
  }

  fetchUserInfo() {
    return platformAuthorizedRequest<{ login: string }[]>(
      'twitch',
      `https://api.twitch.tv/helix/users?id=${this.twitchId}`,
    ).then(json => (json[0] && json[0].login ? { username: json[0].login! } : {}));
  }

  fetchViewerCount(): Promise<number> {
    return platformRequest<{ stream?: { viewers: number } }>(
      'twitch',
      `https://api.twitch.tv/kraken/streams/${this.twitchId}`,
    ).then(json => (json.stream ? json.stream.viewers : 0));
  }

  async putChannelInfo({ title, game, tags = [] }: ITwitchStartStreamOptions): Promise<boolean> {
    await Promise.all([
      platformAuthorizedRequest('twitch', {
        url: `https://api.twitch.tv/kraken/channels/${this.twitchId}`,
        method: 'PUT',
        body: JSON.stringify({ channel: { game, status: title } }),
      }),
      this.setStreamTags(tags),
    ]);
    this.SET_STREAM_SETTINGS({ title, game, tags });
    return true;
  }

  searchGames(searchString: string): Promise<IGame[]> {
    return platformRequest<{ games: IGame[] }>(
      'twitch',
      `https://api.twitch.tv/kraken/search/games?query=${searchString}`,
    ).then(json => json.games);
  }

  get chatUrl(): string {
    const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const nightMode = mode === 'day' ? 'popout' : 'darkpopout';
    return `https://twitch.tv/popout/${this.username}/chat?${nightMode}`;
  }

  get streamPageUrl() {
    return `https://twitch.tv/${this.username}`;
  }

  async getAllTags(): Promise<void> {
    // Fetch stream tags once per session as they're unlikely to change that often
    if (this.state.availableTags.length) return;
    this.SET_AVAILABLE_TAGS(await getAllTags());
  }

  getStreamTags(): Promise<TTwitchTag[]> {
    assertIsDefined(this.twitchId);
    return getStreamTags(this.twitchId);
  }

  async setStreamTags(tags: TTwitchTag[]) {
    const hasPermission = await this.hasScope('user:edit:broadcast');

    if (!hasPermission) {
      return false;
    }
    assertIsDefined(this.twitchId);
    return updateTags()(tags)(this.twitchId);
  }

  hasScope(scope: TTwitchOAuthScope): Promise<boolean> {
    // eslint-disable-next-line prettier/prettier
    return platformAuthorizedRequest('twitch', 'https://id.twitch.tv/oauth2/validate').then(
      (response: ITwitchOAuthValidateResponse) => response.scopes.includes(scope),
    );
  }

  async getHasUpdateTagsPermission() {
    // if available tags are loaded then the user has permissions
    if (this.state.availableTags.length) return true;
    // otherwise make a request to Twitch
    return await this.hasScope('user:edit:broadcast');
  }

  getHeaders(req: IPlatformRequest, authorized = false): ITwitchRequestHeaders {
    const isNewApi = req.url.indexOf('https://api.twitch.tv/helix/') === 0;
    return {
      'Client-Id': this.clientId,
      Accept: 'application/vnd.twitchtv.v5+json',
      'Content-Type': 'application/json',
      ...(authorized
        ? { Authorization: `${isNewApi ? 'Bearer' : 'OAuth'} ${this.oauthToken}` }
        : {}),
    };
  }

  get liveDockEnabled(): boolean {
    return true;
  }
}
