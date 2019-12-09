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
import { authorizedHeaders, handleResponse } from '../../util/requests';
import { UserService } from '../user';
import { integer } from 'aws-sdk/clients/cloudfront';
import { IPlatformResponse, platformAuthorizedRequest, platformRequest } from './utils';
import { StreamSettingsService } from 'services/settings/streaming';
import { Subject } from 'rxjs';
import { CustomizationService } from 'services/customization';

interface IMixerServiceState {
  typeIdMap: object;
}

interface IMixerRawChannel {
  id: string;
  streamKey: string;
  name: string;
  type?: { name: string }; // game name
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

    // trigger `channelInfoChanged` event with new "chatUrl" based on the changed theme
    this.customizationService.settingsChanged.subscribe(updatedSettings => {
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
      .then(handleResponse)
      .then(response => {
        this.userService.updatePlatformToken('mixer', response.access_token);
      });
  }

  fetchRawChannelInfo() {
    return platformAuthorizedRequest<IMixerRawChannel>(
      'mixer',
      `${this.apiBase}channels/${this.mixerUsername}/details`,
    ).then(json => {
      this.userService.updatePlatformChannelId('mixer', json.id);
      return json;
    });
  }

  fetchStreamKey(): Promise<string> {
    return this.fetchRawChannelInfo().then(json => `${json.id}-${json.streamKey}`);
  }

  /**
   * obtain channel info for the GoLive window
   */
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

  /**
   * update the local info for current channel and emit the "channelInfoChanged" event
   */
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
    return platformRequest<{ viewersCurrent: number }>(
      'mixer',
      `${this.apiBase}channels/${this.mixerUsername}`,
    ).then(json => json.viewersCurrent);
  }

  async putChannelInfo({ title, game }: IMixerStartStreamOptions): Promise<boolean> {
    const data = { name: title };

    if (this.state.typeIdMap[game]) {
      data['typeId'] = this.state.typeIdMap[game];
    }

    await platformAuthorizedRequest('mixer', {
      url: `${this.apiBase}channels/${this.channelId}`,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    this.updateActiveChannel({ title, game });
    return true;
  }

  searchGames(searchString: string): Promise<IGame[]> {
    return platformRequest<{ id: number; name: string }[]>(
      'mixer',
      `${this.apiBase}types?limit=10&noCount=1&scope=all&query=${searchString}`,
    ).then(response => {
      response.forEach(game => {
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

    if (this.streamSettingsService.isSafeToModifyStreamKey()) {
      this.streamSettingsService.setSettings({ key, platform: 'mixer', streamType: 'rtmp_common' });
    }

    if (startStreamOptions) await this.putChannelInfo(startStreamOptions);

    return key;
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

  /**
   * Get user-friendly error message
   */
  getErrorDescription(error: IPlatformResponse<unknown>): string {
    return `Can not connect to Mixer`;
  }
}
