import { Service } from 'services/core/service';
import {
  IPlatformService,
  IChannelInfo,
  IGame,
  TPlatformCapability,
  TPlatformCapabilityMap,
  EPlatformCallResult,
  IPlatformRequest,
} from '.';
import { HostsService } from 'services/hosts';
import { SettingsService } from 'services/settings';
import { Inject } from 'services/core/injector';
import { authorizedHeaders } from 'util/requests';
import { UserService } from 'services/user';
import { StreamInfoService } from 'services/stream-info';
import { getAllTags, getStreamTags, TTwitchTag, updateTags } from './twitch/tags';
import { TTwitchOAuthScope } from './twitch/scopes';
import { handlePlatformResponse, platformAuthorizedRequest, platformRequest } from './utils';

/**
 * Request headers that need to be sent to Twitch
 */
export interface ITwitchRequestHeaders extends Dictionary<string> {
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
  setupStreamSettings() {
    return this.fetchStreamKey()
      .then(key => {
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
        return EPlatformCallResult.Success;
      })
      .catch((r: Response) => {
        if (r.status === 403) {
          return EPlatformCallResult.TwitchTwoFactor;
        }

        return EPlatformCallResult.Error;
      });
  }

  fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/twitch/refresh`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handlePlatformResponse)
      .then(response => this.userService.updatePlatformToken(response.access_token));
  }

  fetchRawChannelInfo() {
    return platformAuthorizedRequest('https://api.twitch.tv/kraken/channel');
  }

  fetchStreamKey(): Promise<string> {
    return this.fetchRawChannelInfo().then(json => json.stream_key);
  }

  prepopulateInfo(): Promise<IChannelInfo> {
    return Promise.all([
      this.fetchRawChannelInfo().then(json => ({
        title: json.status,
        game: json.game,
      })),
      this.getStreamTags(),
      // Fetch stream tags once per session as they're unlikely to change that often
      this.streamInfoService.state.channelInfo.availableTags.length
        ? Promise.resolve(this.streamInfoService.state.channelInfo.availableTags)
        : this.getAllTags(),
    ]).then(([channel, tags, availableTags]) => ({
      ...channel,
      tags,
      availableTags,
    }));
  }

  fetchUserInfo() {
    return platformAuthorizedRequest(`https://api.twitch.tv/helix/users?id=${this.twitchId}`).then(
      json => (json[0] && json[0].login ? { username: json[0].login as string } : {}),
    );
  }

  fetchViewerCount(): Promise<number> {
    return platformRequest(`https://api.twitch.tv/kraken/streams/${this.twitchId}`).then(json =>
      json.stream ? json.stream.viewers : 0,
    );
  }

  putChannelInfo({ title, game, tags = [] }: IChannelInfo): Promise<boolean> {
    return Promise.all([
      platformAuthorizedRequest({
        url: `https://api.twitch.tv/kraken/channels/${this.twitchId}`,
        method: 'PUT',
        body: JSON.stringify({ channel: { game, status: title } }),
      }),
      this.setStreamTags(tags),
    ]).then(_ => true);
  }

  searchGames(searchString: string): Promise<IGame[]> {
    return platformRequest(`https://api.twitch.tv/kraken/search/games?query=${searchString}`).then(
      json => json.games,
    );
  }

  getChatUrl(mode: string) {
    const nightMode = mode === 'day' ? 'popout' : 'darkpopout';
    return Promise.resolve(
      `https://twitch.tv/popout/${this.userService.platform.username}/chat?${nightMode}`,
    );
  }

  getAllTags(): Promise<TTwitchTag[]> {
    return getAllTags();
  }

  getStreamTags(): Promise<TTwitchTag[]> {
    return getStreamTags(this.twitchId);
  }

  async setStreamTags(tags: TTwitchTag[]) {
    const hasPermission = await this.hasScope('user:edit:broadcast');

    if (!hasPermission) {
      return false;
    }

    return updateTags()(tags)(this.twitchId);
  }

  searchCommunities(searchString: string) {
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

    return platformRequest({
      url: communitySearchUrl,
      method: 'POST',
      body: JSON.stringify(data),
    }).then(json => json.results[0].hits);
  }

  hasScope(scope: TTwitchOAuthScope): Promise<boolean> {
    return platformAuthorizedRequest('https://id.twitch.tv/oauth2/validate').then(
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

  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService {
    return this.capabilities.has(capability);
  }

  async beforeGoLive() {}
}
