import { StatefulService, mutation } from '../core/stateful-service';
import {
  IPlatformService,
  IChannelInfo,
  IGame,
  TPlatformCapability,
  TPlatformCapabilityMap,
  EPlatformCallResult,
  IPlatformRequest,
} from '.';
import { HostsService } from '../hosts';
import { SettingsService } from '../settings';
import { Inject } from '../core/injector';
import { authorizedHeaders } from '../../util/requests';
import { UserService } from '../user';
import { integer } from 'aws-sdk/clients/cloudfront';
import { handlePlatformResponse, platformAuthorizedRequest, platformRequest } from './utils';

interface IMixerServiceState {
  typeIdMap: object;
}

export class MixerService extends StatefulService<IMixerServiceState> implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;

  capabilities = new Set<TPlatformCapability>(['chat', 'viewer-count']);

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 800,
  };

  apiBase = 'https://mixer.com/api/v1/';

  static initialState: IMixerServiceState = {
    typeIdMap: {},
  };

  @mutation()
  private ADD_GAME_MAPPING(game: string, id: integer) {
    this.state.typeIdMap[game] = id;
  }

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const query = `_=${Date.now()}&skip_splash=true&external=electron&mixer&force_verify&origin=slobs`;
    return `https://${host}/slobs/login?${query}`;
  }

  get oauthToken() {
    return this.userService.platform.token;
  }

  get mixerUsername() {
    return this.userService.platform.username;
  }

  get mixerId() {
    return this.userService.platform.id;
  }

  get channelId() {
    return this.userService.channelId;
  }

  getHeaders(req: IPlatformRequest, authorized = false) {
    return {
      'Content-Type': 'application/json',
      ...(authorized ? { Authorization: `Bearer ${this.oauthToken}` } : {}),
    };
  }

  setupStreamSettings() {
    return this.fetchStreamKey()
      .then(key => {
        const settings = this.settingsService.getSettingsFormData('Stream');

        settings.forEach(subCategory => {
          subCategory.parameters.forEach(parameter => {
            if (parameter.name === 'service') {
              parameter.value = 'Mixer.com - FTL';
            }

            if (parameter.name === 'key') {
              parameter.value = key;
            }
          });
        });

        this.settingsService.setSettings('Stream', settings);
        return EPlatformCallResult.Success;
      })
      .catch(() => EPlatformCallResult.Error);
  }

  fetchUserInfo() {
    return Promise.resolve({});
  }

  fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/mixer/refresh`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handlePlatformResponse)
      .then(response => {
        this.userService.updatePlatformToken(response.access_token);
        this.setupStreamSettings();
      });
  }

  fetchRawChannelInfo() {
    return platformAuthorizedRequest(`${this.apiBase}channels/${this.mixerUsername}/details`).then(
      json => {
        this.userService.updatePlatformChannelId(json.id);
        return json;
      },
    );
  }

  fetchStreamKey(): Promise<string> {
    return this.fetchRawChannelInfo().then(json => `${json.id}-${json.streamKey}`);
  }

  fetchChannelInfo(): Promise<IChannelInfo> {
    return this.fetchRawChannelInfo().then(json => {
      let gameTitle = '';

      if (json.type && json.type.name) {
        gameTitle = json.type.name;
      }

      return {
        title: json.name,
        game: gameTitle,
      };
    });
  }

  prepopulateInfo() {
    return this.fetchChannelInfo();
  }

  fetchViewerCount(): Promise<number> {
    return platformRequest(`${this.apiBase}channels/${this.mixerUsername}`).then(
      json => json.viewersCurrent,
    );
  }

  putChannelInfo({ title, game }: IChannelInfo): Promise<boolean> {
    const data = { name: title };

    if (this.state.typeIdMap[game]) {
      data['typeId'] = this.state.typeIdMap[game];
    }

    return platformAuthorizedRequest({
      url: `${this.apiBase}channels/${this.channelId}`,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  searchGames(searchString: string): Promise<IGame[]> {
    return platformRequest(
      `${this.apiBase}types?limit=10&noCount=1&scope=all&query=${searchString}`,
    ).then(response => {
      response.forEach((game: any) => {
        this.ADD_GAME_MAPPING(game.name, game.id);
      });
      return response;
    });
  }

  getChatUrl(mode: string): Promise<string> {
    return new Promise(resolve => {
      this.fetchRawChannelInfo().then(json => {
        resolve(`https://mixer.com/embed/chat/${json.id}`);
      });
    });
  }

  beforeGoLive() {
    return Promise.resolve();
  }

  // TODO: dedup
  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService {
    return this.capabilities.has(capability);
  }
}
