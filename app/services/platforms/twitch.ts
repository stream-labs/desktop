import { Service } from 'services/core/service';
import {
  EPlatformCallResult,
  IGame,
  IPlatformRequest,
  IPlatformService,
  TPlatformCapability,
  TPlatformCapabilityMap,
} from '.';
import { HostsService } from 'services/hosts';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, handleResponse } from 'util/requests';
import { UserService } from 'services/user';
import { StreamInfoDeprecatedService } from 'services/stream-info-deprecated';
import { getAllTags, getStreamTags, TTwitchTag, updateTags } from './twitch/tags';
import { TTwitchOAuthScope } from './twitch/scopes';
import { IPlatformResponse, platformAuthorizedRequest, platformRequest } from './utils';
import { StreamSettingsService } from 'services/settings/streaming';
import { Subject } from 'rxjs';
import { CustomizationService } from 'services/customization';
import { assertIsDefined } from '../../util/properties-type-guards';
import { metadata, formMetadata } from 'components/shared/inputs';
import { $t } from '../i18n';
import { IGoLiveSettings } from '../streaming';
import { mutation, StatefulService } from '../core';

export interface ITwitchStartStreamOptions {
  title: string;
  game?: string;
  tags?: TTwitchTag[];
}

export interface ITwitchChannelInfo extends ITwitchStartStreamOptions {
  chatUrl: string;
  hasUpdateTagsPermission: boolean;
  availableTags: TTwitchTag[];
}

interface ITWitchChannel {
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

interface ITwitchServiceState {
  hasUpdateTagsPermission: boolean;
  availableTags: TTwitchTag[];
  streamKey: string;
  streamPageUrl: string;
  settings: ITwitchStartStreamOptions;
}

export class TwitchService extends StatefulService<ITwitchServiceState>
  implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() streamSettingsService: StreamSettingsService;
  @Inject() userService: UserService;
  @Inject() streamInfoService: StreamInfoDeprecatedService;
  @Inject() customizationService: CustomizationService;

  static initialState: ITwitchServiceState = {
    hasUpdateTagsPermission: false,
    availableTags: [],
    streamKey: '',
    streamPageUrl: '',
    settings: {
      title: '',
      game: '',
      tags: [],
    },
  };

  readonly displayName = 'Twitch';

  channelInfoChanged = new Subject<ITwitchChannelInfo>();

  capabilities = new Set<TPlatformCapability>([
    'chat',
    'scope-validation',
    'tags',
    'user-info',
    'viewer-count',
  ]);

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 600,
    height: 800,
  };

  // Streamlabs Production Twitch OAuth Client ID
  clientId = '8bmp6j83z5w4mepq0dn0q1a7g186azi';

  private activeChannel: ITwitchChannelInfo | null;

  init() {
    // prepopulate data to make chat available after app start
    this.userService.userLogin.subscribe(_ => {
      if (this.userService.platform?.type === 'twitch') this.prepopulateInfo();
    });

    // trigger `channelInfoChanged` event with new "chatUrl" based on the changed theme
    this.customizationService.settingsChanged.subscribe(updatedSettings => {
      if (updatedSettings.theme) this.updateActiveChannel({});
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
    return this.userService.state.auth.platforms?.twitch.username;
  }

  async beforeGoLive(goLiveSettings?: IGoLiveSettings) {
    const key = await this.fetchStreamKey();
    this.SET_STREAM_KEY(key);
    this.SET_STREAM_PAGE_URL(`https://twitch.tv/${this.username}`);

    if (
      this.streamSettingsService.protectedModeEnabled &&
      this.streamSettingsService.isSafeToModifyStreamKey()
    ) {
      this.streamSettingsService.setSettings({
        key,
        platform: 'twitch',
        streamType: 'rtmp_common',
      });
    }

    const channelInfo = goLiveSettings?.destinations.twitch;
    if (channelInfo) await this.putChannelInfo(channelInfo);
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

    return fetch(request)
      .then(handleResponse)
      .then(response => this.userService.updatePlatformToken('twitch', response.access_token));
  }

  private fetchRawChannelInfo(): Promise<ITWitchChannel> {
    return platformAuthorizedRequest<ITWitchChannel>(
      'twitch',
      'https://api.twitch.tv/kraken/channel',
    );
  }

  fetchStreamKey(): Promise<string> {
    return this.fetchRawChannelInfo().then(json => json.stream_key);
  }

  /**
   * returns perilled data for the EditStreamInfo window
   */
  async prepopulateInfo(): Promise<ITwitchChannelInfo> {
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

    const activeChannel = {
      ...channelInfo,
      hasUpdateTagsPermission,
      tags,
    };
    this.updateActiveChannel(activeChannel);
    assertIsDefined(this.activeChannel);
    return this.activeChannel;
  }

  async fetchGoLiveSettings(): Promise<ITwitchStartStreamOptions> {
    await this.prepopulateInfo();
    return {
      title: this.activeChannel.title,
      game: this.activeChannel.game,
      tags: this.activeChannel.tags,
    };
  }

  /**
   * update the local info for current channel and emit the "channelInfoChanged" event
   */
  private updateActiveChannel(patch: Partial<ITwitchChannelInfo>) {
    const activeChannel = this.activeChannel || {};
    this.activeChannel = {
      ...activeChannel,
      chatUrl: this.getChatUrl(),
      ...patch,
    } as ITwitchChannelInfo;
    assertIsDefined(this.activeChannel);
    this.channelInfoChanged.next(this.activeChannel);
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
    this.updateActiveChannel({ title, game, tags });
    return true;
  }

  searchGames(searchString: string): Promise<IGame[]> {
    return platformRequest<{ games: IGame[] }>(
      'twitch',
      `https://api.twitch.tv/kraken/search/games?query=${searchString}`,
    ).then(json => json.games);
  }

  private getChatUrl(): string {
    const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const nightMode = mode === 'day' ? 'popout' : 'darkpopout';
    return `https://twitch.tv/popout/${this.username}/chat?${nightMode}`;
  }

  async getAllTags(): Promise<TTwitchTag[]> {
    // Fetch stream tags once per session as they're unlikely to change that often
    if (this.state.availableTags.length) return this.state.availableTags;
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

  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService {
    return this.capabilities.has(capability);
  }

  liveDockEnabled(): boolean {
    return true;
  }

  /**
   * Get user-friendly error message
   */
  getErrorDescription(error: IPlatformResponse<unknown>): string {
    return `Can not connect to Twitch: ${error.message}`;
  }

  getStreamFields() {
    return formMetadata({
      title: metadata.text({
        title: $t('Title'),
        fullWidth: true,
        required: true,
      }),
      description: metadata.textArea({
        title: $t('Description'),
        fullWidth: true,
      }),

      twitchGame: metadata.list({
        title: $t('Game on Twitch'),
        placeholder: $t('Start typing to search'),
        options: [],
        internalSearch: false,
        allowEmpty: true,
        noResult: $t('No matching game(s) found.'),
        required: true,
      }),
    });
  }

  @mutation()
  private SET_STREAM_KEY(key: string) {
    this.state.streamKey = key;
  }

  @mutation()
  private SET_STREAM_PAGE_URL(url: string) {
    this.state.streamPageUrl = url;
  }
}
