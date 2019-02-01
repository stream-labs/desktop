import { Service } from 'services/service';
import {
  IPlatformService,
  IPlatformAuth,
  IChannelInfo,
  IGame,
  TPlatformCapability,
  TPlatformCapabilityMap,
} from '.';
import { HostsService } from 'services/hosts';
import { SettingsService } from 'services/settings';
import { Inject } from 'util/injector';
import { handleResponse, requiresToken, authorizedHeaders } from 'util/requests';
import { UserService } from 'services/user';
import { StreamInfoService } from 'services/stream-info';
import { getAllTags, getStreamTags, TTwitchTag, updateTags } from './twitch/tags';
import { TTwitchOAuthScope } from './twitch/scopes';

/**
 * Request headers that need to be sent to Twitch
 */
export interface ITwitchRequestHeaders {
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

export class TwitchService extends Service implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;
  @Inject() streamInfoService: StreamInfoService;

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

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const scopes: TTwitchOAuthScope[] = ['channel_read', 'channel_editor', 'user:edit:broadcast'];

    const query =
      `_=${Date.now()}&skip_splash=true&external=electron&twitch&force_verify&` +
      `scope=${scopes.join(',')}&origin=slobs`;

    return `https://${host}/slobs/login?${query}`;
  }

  get oauthToken() {
    return this.userService.platform.token;
  }

  get twitchId() {
    return this.userService.platform.id;
  }

  // TODO: Some of this code could probably eventually be
  // shared with the Youtube platform.
  setupStreamSettings(auth: IPlatformAuth) {
    this.fetchStreamKey().then(key => {
      const settings = this.settingsService.getSettingsFormData('Stream');

      settings.forEach(subCategory => {
        subCategory.parameters.forEach(parameter => {
          if (parameter.name === 'service') {
            parameter.value = 'Twitch';
          }

          if (parameter.name === 'key') {
            parameter.value = key;
          }
        });
      });

      this.settingsService.setSettings('Stream', settings);
    });
  }

  fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/twitch/refresh`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleResponse)
      .then(response => this.userService.updatePlatformToken(response.access_token));
  }

  @requiresToken()
  fetchRawChannelInfo() {
    const headers = this.getHeaders(true);
    const request = new Request('https://api.twitch.tv/kraken/channel', { headers });

    return fetch(request).then(handleResponse);
  }

  fetchStreamKey(): Promise<string> {
    return this.fetchRawChannelInfo().then(json => json.stream_key);
  }

  fetchChannelInfo(): Promise<IChannelInfo> {
    return Promise.all([
      this.fetchRawChannelInfo().then(json => ({
        title: json.status,
        game: json.game,
      })),
      this.getStreamTags(),
      // Fetch stream tags once per session as they're unlikely to change that often
      this.streamInfoService.state.channelInfo &&
      this.streamInfoService.state.channelInfo.availableTags
        ? Promise.resolve(this.streamInfoService.state.channelInfo.availableTags)
        : this.getAllTags(),
    ]).then(([channel, tags, availableTags]) => ({
      ...channel,
      tags,
      availableTags,
    }));
  }

  @requiresToken()
  fetchUserInfo() {
    const headers = this.getHeaders();
    const request = new Request(`https://api.twitch.tv/helix/users?id=${this.twitchId}`, {
      headers,
    });

    return fetch(request)
      .then(handleResponse)
      .then(json => (json[0] && json[0].login ? { username: json[0].login as string } : {}));
  }

  fetchViewerCount(): Promise<number> {
    const headers = this.getHeaders();
    const request = new Request(`https://api.twitch.tv/kraken/streams/${this.twitchId}`, {
      headers,
    });

    return fetch(request)
      .then(handleResponse)
      .then(json => (json.stream ? json.stream.viewers : 0));
  }

  @requiresToken()
  putChannelInfo({ title, game, tags = [] }: IChannelInfo): Promise<boolean> {
    const headers = this.getHeaders(true);
    const data = { channel: { game, status: title } };
    const request = new Request(`https://api.twitch.tv/kraken/channels/${this.twitchId}`, {
      headers,
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return Promise.all([fetch(request).then(handleResponse), this.setStreamTags(tags)]).then(
      _ => true,
    );
  }

  searchGames(searchString: string): Promise<IGame[]> {
    const headers = this.getHeaders();
    const request = new Request(`https://api.twitch.tv/kraken/search/games?query=${searchString}`, {
      headers,
    });

    return fetch(request)
      .then(handleResponse)
      .then(json => json.games);
  }

  getChatUrl(mode: string) {
    const nightMode = mode === 'day' ? 'popout' : 'darkpopout';
    return Promise.resolve(
      `https://twitch.tv/popout/${this.userService.platform.username}/chat?${nightMode}`,
    );
  }

  @requiresToken()
  getAllTags(): Promise<TTwitchTag[]> {
    return getAllTags(this.getRawHeaders(true));
  }

  @requiresToken()
  getStreamTags(): Promise<TTwitchTag[]> {
    return getStreamTags(this.twitchId, this.getRawHeaders(true, true));
  }

  @requiresToken()
  async setStreamTags(tags: TTwitchTag[]) {
    const hasPermission = await this.hasScope('user:edit:broadcast');

    if (!hasPermission) {
      return false;
    }

    return updateTags(this.getRawHeaders(true, true))(tags)(this.twitchId);
  }

  searchCommunities(searchString: string) {
    const headers = this.getHeaders();

    const data = {
      requests: [
        {
          indexName: 'community',
          params: `query=${searchString}&page=0&hitsPerPage=50&numericFilters=&facets=*&facetFilters=`,
        },
      ],
    };

    const communitySearchUrl =
      'https://xluo134hor-dsn.algolia.net/1/indexes/*/queries' +
      '?x-algolia-application-id=XLUO134HOR&x-algolia-api-key=d157112f6fc2cab93ce4b01227c80a6d';

    const request = new Request(communitySearchUrl, {
      headers,
      method: 'POST',
      body: JSON.stringify(data),
    });

    return fetch(request)
      .then(handleResponse)
      .then(json => json.results[0].hits);
  }

  hasScope(scope: TTwitchOAuthScope): Promise<boolean> {
    return fetch('https://id.twitch.tv/oauth2/validate', {
      headers: this.getHeaders(true),
    })
      .then(handleResponse)
      .then((response: ITwitchOAuthValidateResponse) => response.scopes.includes(scope));
  }

  private getRawHeaders(authorized = false, isNewApi = false) {
    const map: ITwitchRequestHeaders = {
      'Client-Id': this.clientId,
      Accept: 'application/vnd.twitchtv.v5+json',
      'Content-Type': 'application/json',
    };

    return authorized
      ? {
          ...map,
          Authorization: `${isNewApi ? 'Bearer' : 'OAuth'} ${this.oauthToken}`,
        }
      : map;
  }

  private getHeaders(authorized = false, isNewApi = false): Headers {
    const headers = new Headers();

    Object.entries(this.getRawHeaders(authorized, isNewApi)).forEach(([key, value]) => {
      headers.append(key, value);
    });

    return headers;
  }

  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService {
    return this.capabilities.has(capability);
  }

  async beforeGoLive() {}
}
