import { InheritMutations, mutation } from '../core';
import { BasePlatformService } from './base-platform';
import {
  IGame,
  IPlatformRequest,
  IPlatformService,
  IPlatformState,
  TPlatformCapability,
} from './index';
import { authorizedHeaders, jfetch } from '../../util/requests';
import { throwStreamError } from '../streaming/stream-error';
import { platformAuthorizedRequest } from './utils';
import { IGoLiveSettings } from '../streaming';
import { getDefined } from '../../util/properties-type-guards';
import Utils from '../utils';
import { TDisplayType } from 'services/settings-v2';
import { TOutputOrientation } from 'services/restream';
import { IVideo } from 'obs-studio-node';

interface ITwitterServiceState extends IPlatformState {
  settings: ITwitterStartStreamOptions;
  userInfo: ITwitterUserInfo;
  channelInfo: { gameId: string; gameName: string; gameImage: string };
}

export interface ITwitterStartStreamOptions {}

interface ITwitterChannelInfo {
  live_title: string;
  category_id: string;
  category_name: string;
  stream_key: string;
  current_viewers: number;
  followers: number;
}

interface ITwitterUserInfo {
  userId: string;
  channelId: string;
}

@InheritMutations()
export class TwitterPlatformService
  extends BasePlatformService<ITwitterServiceState>
  implements IPlatformService {
  static initialState: ITwitterServiceState = {
    ...BasePlatformService.initialState,
    settings: { title: '', game: '', mode: undefined },
    userInfo: { userId: '', channelId: '' },
    channelInfo: { gameId: '', gameName: '', gameImage: '' },
  };

  readonly capabilities = new Set<TPlatformCapability>([]);
  readonly apiBase = 'https://api.twitter.com/2';
  readonly platform = 'twitter';
  readonly displayName = 'X';
  readonly gameImageSize = { width: 30, height: 40 };
  rtmpServer = '';

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 600,
    height: 800,
  };

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const query = `_=${Date.now()}&skip_splash=true&external=electron&twitter&force_verify&origin=slobs`;
    return `https://${host}/slobs/login?${query}`;
  }

  get username(): string {
    return this.userService.state.auth?.platforms?.twitter?.username || '';
  }

  async beforeGoLive(goLiveSettings: IGoLiveSettings, context?: TDisplayType) {
    const twSettings = getDefined(goLiveSettings.platforms.trovo);

    const key = this.state.streamKey;
    if (!this.streamingService.views.isMultiplatformMode) {
      this.streamSettingsService.setSettings(
        {
          streamType: 'rtmp_custom',
          key,
          server: this.rtmpServer,
        },
        context,
      );
    }

    await this.putChannelInfo(twSettings);

    this.setPlatformContext('twitter');
  }

  fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/twitter/refresh`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers });

    return jfetch<{ access_token: string }>(request).then(response =>
      this.userService.updatePlatformToken('twitter', response.access_token),
    );
  }

  /**
   * Request Twitter API and wrap failed response to a unified error model
   */
  async requestTwitter<T = unknown>(reqInfo: IPlatformRequest | string): Promise<T> {
    try {
      return await platformAuthorizedRequest<T>('twitter', reqInfo);
    } catch (e: unknown) {
      let details = (e as any).message;
      if (!details) details = 'connection failed';
      throwStreamError('PLATFORM_REQUEST_FAILED', e as any, details);
    }
  }

  /**
   * prepopulate channel info and save it to the store
   */
  async prepopulateInfo(): Promise<void> {
    const channelInfo = await this.fetchChannelInfo();
    const userInfo = await this.requestTwitter<ITwitterUserInfo>(`${this.apiBase}/getuserinfo`);
    this.SET_STREAM_SETTINGS({ title: channelInfo.live_title, game: channelInfo.category_id });
    this.SET_USER_INFO(userInfo);
    this.SET_STREAM_KEY(channelInfo.stream_key.replace('live/', ''));
    // TODO: the order of mutations is corrupted for the GoLive window
    // adding a sleep() call here to ensure the "SET_PREPOPULATED" will come in the last place
    await Utils.sleep(50);
    this.SET_PREPOPULATED(true);
  }

  async putChannelInfo(settings: ITwitterStartStreamOptions): Promise<void> {
    const channel_id = this.state.userInfo.channelId;
    this.UPDATE_STREAM_SETTINGS(settings);
    await this.requestTwitter<ITwitterChannelInfo>({
      url: '',
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  private fetchChannelInfo(): Promise<ITwitterChannelInfo> {
    return this.requestTwitter<ITwitterChannelInfo>('');
  }

  getHeaders() {
    const token = this.userService.state.auth!.platforms.twitter?.token;
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Client-ID': '4f78d282c0f72dc3143da8278f697fc4',
      ...(token ? { Authorization: `OAuth ${token}` } : {}),
    };
  }

  get liveDockEnabled(): boolean {
    return true;
  }

  async fetchViewerCount(): Promise<number> {
    return (await this.fetchChannelInfo()).current_viewers;
  }

  async fetchFollowers(): Promise<number> {
    return (await this.fetchChannelInfo()).followers;
  }

  get streamPageUrl() {
    return '';
  }

  get chatUrl() {
    return '';
  }

  @mutation()
  private SET_USER_INFO(userInfo: ITwitterUserInfo) {
    this.state.userInfo = userInfo;
  }

  @mutation()
  private SET_CHANNEL_INFO(info: ITwitterServiceState['channelInfo']) {
    this.state.channelInfo = info;
  }
}
