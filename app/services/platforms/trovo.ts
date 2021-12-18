import { InheritMutations, Inject } from '../core';
import { BasePlatformService } from './base-platform';
import { UserService } from '../user';
import { IPlatformRequest, IPlatformService, IPlatformState, TPlatformCapability } from './index';
import { authorizedHeaders, jfetch } from '../../util/requests';
import { throwStreamError } from '../streaming/stream-error';
import { platformAuthorizedRequest } from './utils';
import { IGoLiveSettings } from '../streaming';

export interface ITrovoStartStreamOptions {
  title: string;
}

interface ITrovoServiceState extends IPlatformState {
  settings: ITrovoStartStreamOptions;
}

@InheritMutations()
export class TrovoService
  extends BasePlatformService<ITrovoServiceState>
  implements IPlatformService {
  @Inject() userService: UserService;

  static initialState: ITrovoServiceState = {
    ...BasePlatformService.initialState,
    settings: { title: '' },
  };

  readonly apiBase = 'https://open-api.trovo.live';
  readonly platform = 'trovo';
  readonly displayName = 'Trovo';

  readonly capabilities = new Set<TPlatformCapability>(['title']);

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 600,
    height: 800,
  };

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const query = `_=${Date.now()}&skip_splash=true&external=electron&trovo&force_verify&origin=slobs`;
    return `https://${host}/slobs/login?${query}`;
  }

  get username(): string {
    return this.userService.state.auth?.platforms?.trovo?.username || '';
  }

  async beforeGoLive(goLiveSettings: IGoLiveSettings) {
    const streamKey = 'streamkeyPlaceholder';
    if (!this.streamingService.views.isMultiplatformMode) {
      this.streamSettingsService.setSettings({
        platform: 'youtube',
        key: streamKey,
        streamType: 'rtmp_common',
        server: 'rtmp://a.rtmp.youtube.com/live2',
      });
    }
  }

  fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/trovo/refresh`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers });

    return jfetch<{ access_token: string }>(request).then(response =>
      this.userService.updatePlatformToken('trovo', response.access_token),
    );
  }

  /**
   * Request Twitch API and wrap failed response to a unified error model
   */
  async requestTwitch<T = unknown>(reqInfo: IPlatformRequest | string): Promise<T> {
    try {
      return await platformAuthorizedRequest<T>('trovo', reqInfo);
    } catch (e: unknown) {
      // const details = (e as any).result
      //   ? `${(e as any).result.status} ${(e as any).result.error} ${(e as any).result.message}`
      //   : 'Connection failed';
      // let errorType: TStreamErrorType;
      // switch ((e as any).result?.message) {
      //   case 'missing required oauth scope':
      //     errorType = 'TWITCH_MISSED_OAUTH_SCOPE';
      //     break;
      //   case 'Status contains banned words.':
      //     errorType = 'TWITCH_BANNED_WORDS';
      //     break;
      //   default:
      //     errorType = 'PLATFORM_REQUEST_FAILED';
      // }
      // throwStreamError(errorType, e as any, details);
      throwStreamError('PLATFORM_REQUEST_FAILED', e as any);
    }
  }

  /**
   * prepopulate channel info and save it to the store
   */
  async prepopulateInfo(): Promise<void> {
    this.SET_PREPOPULATED(true);
  }

  async putChannelInfo(settings: {}): Promise<void> {
    // this.SET_STREAM_SETTINGS({ title, game, tags });
  }

  getHeaders() {
    const token = 'tokenPlaceholder';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  get liveDockEnabled(): boolean {
    return true;
  }

  get streamPageUrl() {
    return 'streamPageUrl';
  }

  get chatUrl() {
    return 'chatUrl';
  }
}
