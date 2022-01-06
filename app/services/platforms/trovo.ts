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

interface ITrovoServiceState extends IPlatformState {
  settings: ITrovoStartStreamOptions;
  userInfo: ITrovoUserInfo;
  channelInfo: { category_name: string };
}

export interface ITrovoStartStreamOptions {
  title: string;
  game: string;
}

interface ITrovoChannelInfo {
  live_title: string;
  category_id: string;
  category_name: string;
  stream_key: string;
  current_viewers: number;
}

interface ITrovoUserInfo {
  userId: string;
  channelId: string;
}

@InheritMutations()
export class TrovoService
  extends BasePlatformService<ITrovoServiceState>
  implements IPlatformService {
  static initialState: ITrovoServiceState = {
    ...BasePlatformService.initialState,
    settings: { title: '', game: '' },
    userInfo: { userId: '', channelId: '' },
    channelInfo: { category_name: '' },
  };

  readonly apiBase = 'https://open-api.trovo.live/openplatform';
  readonly rtmpServer = 'rtmp://livepush.trovo.live/live/';
  readonly platform = 'trovo';
  readonly displayName = 'Trovo';
  readonly gameImageSize = { width: 30, height: 40 };

  readonly capabilities = new Set<TPlatformCapability>(['title', 'chat']);

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
    const trSettings = getDefined(goLiveSettings.platforms.trovo);
    const key = this.state.streamKey;
    if (!this.streamingService.views.isMultiplatformMode) {
      this.streamSettingsService.setSettings({
        streamType: 'rtmp_custom',
        key,
        server: this.rtmpServer,
      });
    }
    await this.putChannelInfo(trSettings);
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
   * Request Trovo API and wrap failed response to a unified error model
   */
  async requestTrovo<T = unknown>(reqInfo: IPlatformRequest | string): Promise<T> {
    try {
      return await platformAuthorizedRequest<T>('trovo', reqInfo);
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
    const userInfo = await this.requestTrovo<ITrovoUserInfo>(`${this.apiBase}/getuserinfo`);
    this.SET_STREAM_SETTINGS({ title: channelInfo.live_title, game: channelInfo.category_id });
    this.SET_USER_INFO(userInfo);
    this.SET_CATEGORY_NAME(channelInfo.category_name);
    this.SET_STREAM_KEY(channelInfo.stream_key.replace('live/', ''));
    this.SET_PREPOPULATED(true);
  }

  async putChannelInfo(settings: ITrovoStartStreamOptions): Promise<void> {
    const channel_id = this.state.userInfo.channelId;
    this.UPDATE_STREAM_SETTINGS(settings);
    await this.requestTrovo<ITrovoChannelInfo>({
      url: `${this.apiBase}/channels/update`,
      method: 'POST',
      body: JSON.stringify({ channel_id, live_title: settings.title, category: settings.game }),
    });
  }

  private fetchChannelInfo(): Promise<ITrovoChannelInfo> {
    return this.requestTrovo<ITrovoChannelInfo>(`${this.apiBase}/channel`);
  }

  async searchGames(searchString: string): Promise<IGame[]> {
    type TResponse = { category_info: { id: string; name: string; icon_url: string }[] };
    const response = await this.requestTrovo<TResponse>({
      url: `${this.apiBase}/searchcategory`,
      method: 'POST',
      body: JSON.stringify({ query: searchString }),
    });
    return response.category_info.map(g => ({
      id: g.id,
      name: g.name,
      image: g.icon_url,
    }));
  }

  async fetchGame(name: string): Promise<IGame> {
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

  getHeaders() {
    const token = this.userService.state.auth!.platforms.trovo.token;
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

  get streamPageUrl() {
    return `https://trovo.live/${this.username}`;
  }

  get chatUrl() {
    return `https://trovo.live/chat/${this.username}`;
  }

  @mutation()
  private SET_USER_INFO(userInfo: ITrovoUserInfo) {
    this.state.userInfo = userInfo;
  }

  @mutation()
  private SET_CATEGORY_NAME(categoryName: string) {
    this.state.channelInfo.category_name = categoryName;
  }
}
