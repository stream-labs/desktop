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
import { authorizedHeaders, jfetch } from 'util/requests';
import { UserService } from 'services/user';
import { TTwitchOAuthScope, TwitchTagsService } from './twitch/index';
import { platformAuthorizedRequest } from './utils';
import { CustomizationService } from 'services/customization';
import { IGoLiveSettings } from 'services/streaming';
import { InheritMutations, mutation } from 'services/core';
import { throwStreamError, TStreamErrorType } from 'services/streaming/stream-error';
import { BasePlatformService } from './base-platform';
import Utils from '../utils';
import { IVideo } from 'obs-studio-node';
import { TDisplayType } from 'services/settings-v2';
import { TOutputOrientation } from 'services/restream';

export interface ITwitchStartStreamOptions {
  title: string;
  game?: string;
  tags: string[];
  mode?: TOutputOrientation;
}

export interface ITwitchChannelInfo extends ITwitchStartStreamOptions {
  hasUpdateTagsPermission: boolean;
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
  hasPollsPermission: boolean;
  settings: ITwitchStartStreamOptions;
}

const UNLISTED_GAME_CATEGORY = { id: '0', name: 'Unlisted', box_art_url: '' };

@InheritMutations()
export class TwitchService
  extends BasePlatformService<ITwitchServiceState>
  implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() twitchTagsService: TwitchTagsService;

  static initialState: ITwitchServiceState = {
    ...BasePlatformService.initialState,
    hasUpdateTagsPermission: false,
    hasPollsPermission: false,
    settings: {
      title: '',
      game: '',
      tags: [],
      mode: undefined,
    },
  };

  readonly apiBase = 'https://api.twitch.tv';
  readonly platform = 'twitch';
  readonly displayName = 'Twitch';
  readonly gameImageSize = { width: 30, height: 40 };

  readonly capabilities = new Set<TPlatformCapability>([
    'title',
    'chat',
    'scope-validation',
    'tags',
    'game',
    'user-info',
    'streamlabels',
    'themes',
    'viewerCount',
  ]);

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 600,
    height: 800,
  };

  // Streamlabs Production Twitch OAuth Client ID
  clientId = Utils.shouldUseBeta()
    ? '3eoucd9qwxqh7pu3l0e3rttomgrov2'
    : '8bmp6j83z5w4mepq0dn0q1a7g186azi';

  init() {
    // prepopulate data to make chat available after app start
    this.userService.userLogin.subscribe(_ => {
      if (this.userService.platform?.type === 'twitch') {
        this.prepopulateInfo();

        // Check for updated polls scopes
        this.validatePollsScope();
        // Check for updated tags scopes
        this.validateTagsScope();
      }
    });
  }

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const scopes: TTwitchOAuthScope[] = [
      'channel_read',
      'channel_editor',
      'user:edit:broadcast',
      'channel:manage:broadcast',
    ];

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

  get tags(): string[] {
    return this.state.settings.tags;
  }

  async beforeGoLive(goLiveSettings?: IGoLiveSettings, context?: TDisplayType) {
    if (
      this.streamSettingsService.protectedModeEnabled &&
      this.streamSettingsService.isSafeToModifyStreamKey()
    ) {
      let key = await this.fetchStreamKey();
      // do not start actual stream when testing
      if (Utils.isTestMode()) {
        key = key.split('?')[0] + `?bandwidthtest=true&rnd=${Math.random()}`;
      }
      this.SET_STREAM_KEY(key);
      if (!this.streamingService.views.isMultiplatformMode) {
        this.streamSettingsService.setSettings(
          {
            key,
            platform: 'twitch',
            streamType: 'rtmp_common',
            server: 'auto',
          },
          context,
        );
      }
    }

    if (goLiveSettings) {
      const channelInfo = goLiveSettings?.platforms.twitch;
      if (channelInfo) await this.putChannelInfo(channelInfo);
    }

    this.setPlatformContext('twitch');
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
    } catch (e: unknown) {
      const details = (e as any).result
        ? `${(e as any).result.status} ${(e as any).result.error} ${(e as any).result.message}`
        : 'Connection failed';
      let errorType: TStreamErrorType;
      switch ((e as any).result?.message) {
        case 'missing required oauth scope':
          errorType = 'TWITCH_MISSED_OAUTH_SCOPE';
          break;
        case 'Status contains banned words.':
          errorType = 'TWITCH_BANNED_WORDS';
          break;
        default:
          errorType = 'PLATFORM_REQUEST_FAILED';
      }
      throwStreamError(errorType, e as any, details);
    }
  }

  fetchStreamKey(): Promise<string> {
    return this.requestTwitch<{ data: { stream_key: string }[] }>(
      `${this.apiBase}/helix/streams/key?broadcaster_id=${this.twitchId}`,
    ).then(json => json.data[0].stream_key);
  }

  /**
   * prepopulate channel info and save it to the store
   */
  async prepopulateInfo(): Promise<void> {
    const [channelInfo] = await Promise.all([
      this.requestTwitch<{ data: { title: string; game_name: string }[] }>(
        `${this.apiBase}/helix/channels?broadcaster_id=${this.twitchId}`,
      ).then(json => ({
        title: json.data[0].title,
        game: json.data[0].game_name,
      })),
    ]);

    const tags: string[] = this.twitchTagsService.views.hasTags
      ? this.twitchTagsService.views.tags
      : [];
    this.SET_PREPOPULATED(true);
    this.SET_STREAM_SETTINGS({ tags, title: channelInfo.title, game: channelInfo.game });
  }

  fetchUserInfo() {
    return platformAuthorizedRequest<{ login: string }[]>(
      'twitch',
      `${this.apiBase}/helix/users?id=${this.twitchId}`,
    ).then(json => (json[0] && json[0].login ? { username: json[0].login! } : {}));
  }

  fetchViewerCount(): Promise<number> {
    return platformAuthorizedRequest<{ data: { viewer_count: number }[] }>(
      'twitch',
      `${this.apiBase}/helix/streams?user_id=${this.twitchId}`,
    ).then(json => json.data[0]?.viewer_count ?? 0);
  }

  fetchFollowers(): Promise<number> {
    return this.requestTwitch<{ total: number }>({
      url: `${this.apiBase}/helix/users/follows?to_id=${this.twitchId}`,
    }).then(json => json.total);
  }

  async putChannelInfo({ title, game, tags = [] }: ITwitchStartStreamOptions): Promise<void> {
    let gameId = '';
    const isUnlisted = game === UNLISTED_GAME_CATEGORY.name;
    if (isUnlisted) gameId = '0';
    if (game && !isUnlisted) {
      gameId = await this.requestTwitch<{ data: { id: string }[] }>(
        `${this.apiBase}/helix/games?name=${encodeURIComponent(game)}`,
      ).then(json => json.data[0].id);
    }
    this.twitchTagsService.actions.setTags(tags);
    const hasPermission = await this.hasScope('channel:manage:broadcast');
    const scopedTags = hasPermission ? tags : undefined;
    await Promise.all([
      this.requestTwitch({
        url: `${this.apiBase}/helix/channels?broadcaster_id=${this.twitchId}`,
        method: 'PATCH',
        body: JSON.stringify({ game_id: gameId, title, tags: scopedTags }),
      }),
    ]);
    this.SET_STREAM_SETTINGS({ title, game, tags });
  }

  async searchGames(searchString: string): Promise<IGame[]> {
    const gamesResponse = await platformAuthorizedRequest<{
      data: { id: string; name: string; box_art_url: string }[];
    }>('twitch', `${this.apiBase}/helix/search/categories?query=${searchString}`);
    const data = gamesResponse.data || [];

    const shouldIncludeUnlisted =
      searchString.toLowerCase() === 'unlisted'.substring(0, searchString.length);

    if (shouldIncludeUnlisted) {
      data.push(UNLISTED_GAME_CATEGORY);
    }

    return data.map(g => ({ id: g.id, name: g.name, image: g.box_art_url }));
  }

  async fetchGame(name: string): Promise<IGame> {
    if (name === UNLISTED_GAME_CATEGORY.name) return UNLISTED_GAME_CATEGORY;

    const gamesResponse = await platformAuthorizedRequest<{
      data: { id: string; name: string; box_art_url: string }[];
    }>('twitch', `${this.apiBase}/helix/games?name=${encodeURIComponent(name)}`);
    return gamesResponse.data.map(g => {
      const imageTemplate = g.box_art_url;
      const imageSize = this.gameImageSize;
      const image = imageTemplate
        .replace('{width}', imageSize.width.toString())
        .replace('{height}', imageSize.height.toString());
      return { id: g.id, name: g.name, image };
    })[0];
  }

  get chatUrl(): string {
    const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const nightMode = mode === 'day' ? 'popout' : 'darkpopout';
    return `https://twitch.tv/popout/${this.username}/chat?${nightMode}`;
  }

  get streamPageUrl() {
    return `https://twitch.tv/${this.username}`;
  }

  async validateTagsScope() {
    const hasTagsScope = await this.hasScope('channel:manage:broadcast');
    this.SET_HAS_TAGS_PERMISSION(hasTagsScope);
  }

  async validatePollsScope() {
    const hasPollsPermission = await this.hasScope('channel:manage:polls');
    this.SET_HAS_POLLS_PERMISSION(hasPollsPermission);
  }

  hasScope(scope: TTwitchOAuthScope): Promise<boolean> {
    // prettier-ignore
    return platformAuthorizedRequest('twitch', 'https://id.twitch.tv/oauth2/validate').then(
      (response: ITwitchOAuthValidateResponse) => response.scopes.includes(scope),
    );
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

  @mutation()
  private SET_HAS_POLLS_PERMISSION(hasPollsPermission: boolean) {
    this.state.hasPollsPermission = hasPollsPermission;
  }

  @mutation()
  private SET_HAS_TAGS_PERMISSION(hasUpdateTagsPermission: boolean) {
    this.state.hasUpdateTagsPermission = hasUpdateTagsPermission;
  }
}
