import { StatefulService, mutation } from '../core/stateful-service';
import {
  IPlatformService,
  IGame,
  TPlatformCapability,
  TPlatformCapabilityMap,
  EPlatformCallResult,
  IPlatformRequest,
} from '.';
import { HostsService } from '../hosts';
import { Inject } from 'services/core/injector';
import { authorizedHeaders } from '../../util/requests';
import { UserService } from '../user';
import { integer } from 'aws-sdk/clients/cloudfront';
import { handlePlatformResponse, platformAuthorizedRequest, platformRequest } from './utils';
import { StreamSettingsService } from 'services/settings/streaming';
import { Subject } from 'rxjs';
import { ITwitchChannelInfo } from './twitch';
import { CustomizationService } from 'services/customization';

interface IMixerServiceState {
  typeIdMap: object;
}

export interface IMixerStartStreamOptions {
  title: string;
  game: string;
}

export interface IMixerChannelInfo extends IMixerStartStreamOptions {
  channelId: string;
  chatUrl: string;
}

export class MixerService extends StatefulService<IMixerServiceState> implements IPlatformService {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private customizationService: CustomizationService;

  capabilities = new Set<TPlatformCapability>(['chat', 'viewer-count']);
  channelInfoChanged = new Subject<IMixerChannelInfo>();
  private activeChannel: IMixerChannelInfo;

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

  init() {
    // prepopulate data to make chat available after app start
    this.userService.userLogin.subscribe(_ => {
      if (this.userService.platform.type === 'mixer') this.prepopulateInfo();
    });

    this.customizationService.settingsChanged.subscribe(updatedSettings => {
      // trigger `channelInfoChanged` event to with new chat url based on the changed theme
      if (updatedSettings.theme) this.updateActiveChannel({});
    });
  }

  getHeaders(req: IPlatformRequest, authorized = false) {
    return {
      'Content-Type': 'application/json',
      ...(authorized ? { Authorization: `Bearer ${this.oauthToken}` } : {}),
    };
  }

  validatePlatform() {
    // there is nothing to validate for Mixer
    return Promise.resolve(EPlatformCallResult.Success);
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

  async prepopulateInfo() {
    const json = await this.fetchRawChannelInfo();
    let gameTitle = '';

    if (json.type && json.type.name) {
      gameTitle = json.type.name;
    }

    this.updateActiveChannel({
      channelId: json.id,
      title: json.name,
      game: gameTitle,
    });

    return this.activeChannel;
  }

  private updateActiveChannel(patch: Partial<IMixerChannelInfo>) {
    if (!this.activeChannel) this.activeChannel = {} as IMixerChannelInfo;
    const channelId = patch.channelId || this.activeChannel.channelId;
    this.activeChannel = {
      ...this.activeChannel,
      chatUrl: this.getChatUrl(channelId),
      ...patch,
    };
    this.channelInfoChanged.next(this.activeChannel);
  }

  fetchViewerCount(): Promise<number> {
    return platformRequest(`${this.apiBase}channels/${this.mixerUsername}`).then(
      json => json.viewersCurrent,
    );
  }

  async putChannelInfo({ title, game }: ITwitchChannelInfo): Promise<boolean> {
    const data = { name: title };

    if (this.state.typeIdMap[game]) {
      data['typeId'] = this.state.typeIdMap[game];
    }

    await platformAuthorizedRequest({
      url: `${this.apiBase}channels/${this.channelId}`,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    this.updateActiveChannel({ title, game });
    return true;
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

  private getChatUrl(channelId: string): string {
    return `https://mixer.com/embed/chat/${channelId}`;
  }

  async beforeGoLive(startStreamOptions?: IMixerStartStreamOptions) {
    const key = await this.fetchStreamKey();
    const currentStreamSettings = this.streamSettingsService.settings;

    // disable protectedMode for users who manually changed their stream key before
    const needToDisableProtectedMode: boolean =
      currentStreamSettings.platform === 'mixer' &&
      currentStreamSettings.key &&
      currentStreamSettings.key !== key;

    if (needToDisableProtectedMode) {
      this.streamSettingsService.setSettings({ protectedModeEnabled: false });
    } else {
      this.streamSettingsService.setSettings({
        key,
        platform: 'mixer',
        protectedModeEnabled: true,
      });
    }
  }

  // TODO: dedup
  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService {
    return this.capabilities.has(capability);
  }

  liveDockEnabled(): boolean {
    return true;
  }
}
