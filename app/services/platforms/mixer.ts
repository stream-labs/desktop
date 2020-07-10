import { StatefulService, mutation, InheritMutations } from 'services/core/stateful-service';
import {
  IPlatformService,
  IGame,
  TPlatformCapability,
  TPlatformCapabilityMap,
  EPlatformCallResult,
  IPlatformRequest,
  IPlatformState,
} from '.';
import { HostsService } from '../hosts';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, handleResponse } from '../../util/requests';
import { UserService } from '../user';
import { integer } from 'aws-sdk/clients/cloudfront';
import { platformAuthorizedRequest, platformRequest } from './utils';
import { StreamSettingsService } from 'services/settings/streaming';
import { Subject } from 'rxjs';
import { CustomizationService } from 'services/customization';
import { IInputMetadata } from '../../components/shared/inputs';
import { IGoLiveSettings } from '../streaming';
import { throwStreamError } from '../streaming/stream-error';
import { BasePlatformService } from './base-platform';

interface IMixerServiceState extends IPlatformState {
  typeIdMap: object;
  settings: IMixerStartStreamOptions;
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

@InheritMutations()
export class MixerService extends BasePlatformService<IMixerServiceState>
  implements IPlatformService {
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private customizationService: CustomizationService;

  readonly capabilities = new Set<TPlatformCapability>(['chat']);
  channelInfoChanged = new Subject<IMixerChannelInfo>();
  private activeChannel: IMixerChannelInfo;

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 800,
  };

  apiBase = 'https://mixer.com/api/v1/';

  static initialState: IMixerServiceState = {
    ...BasePlatformService.initialState,
    typeIdMap: {},
    settings: {
      title: '',
      game: '',
    },
  };

  readonly platform = 'mixer';
  readonly displayName = 'Mixer';

  get unlinkUrl() {
    return `https://${this.hostsService.streamlabs}/api/v5/user/accounts/unlink/mixer_account`;
  }

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
    return this.userService.state.auth?.platforms?.mixer?.token;
  }

  get mixerUsername() {
    return this.userService.state.auth?.platforms?.mixer?.username;
  }

  get channelId() {
    return this.userService.state.auth?.platforms?.mixer?.channelId;
  }

  init() {
    // prepopulate data to make chat available after app start
    this.userService.userLogin.subscribe(_ => {
      if (this.userService.platform?.type === 'mixer') this.prepopulateInfo();
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

  private fetchRawChannelInfo() {
    return this.requestMixer<IMixerRawChannel>(
      `${this.apiBase}channels/${this.mixerUsername}/details`,
    ).then(json => {
      this.userService.updatePlatformChannelId('mixer', json.id);
      return json;
    });
  }

  /**
   * Request Mixer API and wrap failed response to a unified error model
   */
  private async requestMixer<T = unknown>(reqInfo: IPlatformRequest | string): Promise<T> {
    try {
      return await platformAuthorizedRequest<T>('mixer', reqInfo);
    } catch (e) {
      const details = e.result
        ? `${e.result.statusCode} ${e.result.error} ${e.result.message}`
        : 'Connection failed';
      throwStreamError('PLATFORM_REQUEST_FAILED', details, 'mixer');
    }
  }

  fetchStreamKey(): Promise<string> {
    return this.fetchRawChannelInfo().then(json => `${json.id}-${json.streamKey}`);
  }

  getStreamFields(): Dictionary<IInputMetadata> {
    return {};
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

    this.SET_PREPOPULATED(true);
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
      ...patch,
    };
    this.SET_STREAM_PAGE_URL(`https://mixer.com/${this.mixerUsername}`);
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

    await this.requestMixer({
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

  get chatUrl(): string {
    return `https://mixer.com/embed/chat/${this.channelId}`;
  }

  async beforeGoLive(settings?: IGoLiveSettings) {
    const key = await this.fetchStreamKey();

    if (this.streamSettingsService.isSafeToModifyStreamKey()) {
      this.streamSettingsService.setSettings({ key, platform: 'mixer', streamType: 'rtmp_common' });
    }

    if (settings) await this.putChannelInfo(settings.destinations.mixer);
    this.SET_STREAM_KEY(key);
  }

  liveDockEnabled(): boolean {
    return true;
  }
}
