import { Service } from 'services/core/service';
import { IPlatformService, IStreamingSetting } from '.';
import { HostsService } from 'services/hosts';
import { SettingsService } from 'services/settings';
import { Inject } from 'services/core/injector';
import { sleep } from 'util/sleep';
import { handleErrors, requiresToken, authorizedHeaders } from 'util/requests';
import { UserService } from 'services/user';
import { parseString } from 'xml2js';
import { StreamingService, EStreamingState } from 'services/streaming';
import { WindowsService } from 'services/windows';
import { NicoliveClient } from 'services/nicolive-program/NicoliveClient';

export type INiconicoProgramSelection = {
  info: LiveProgramInfo;
  selectedId: string;
};

function parseXml(xml: String): Promise<object> {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) {
        // sentryに送る
        console.error(err, xml);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

type Program = {
  id: string;
};

type SocialGroup = {
  type: 'community' | 'channel';
  id: string;
  name: string;
  thumbnailUrl: string;
  broadcastablePrograms: Program[];
};

export type LiveProgramInfo = {
  community?: SocialGroup;
  channels?: SocialGroup[];
};

export class NiconicoService extends Service implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;
  @Inject() streamingService: StreamingService;
  @Inject() windowsService: WindowsService;

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 800,
  };

  client: NicoliveClient = new NicoliveClient();

  async getUserId(): Promise<string> {
    const url = `${this.hostsService.niconicoAccount}/api/public/v1/user/id.json`;
    const request = new Request(url, { credentials: 'same-origin' });

    const response = await fetch(request);
    const response_1 = await handleErrors(response);
    const json = await response_1.json();
    if (json.data && json.data.userId) {
      return json.data.userId;
    }
    return '';
  }

  async isLoggedIn(): Promise<boolean> {
    const id = await this.getUserId();
    return id !== '';
  }

  async isPremium(token: string): Promise<boolean> {
    const url = `${this.hostsService.niconicoOAuth}/v1/user/premium.json`;
    const headers = authorizedHeaders(token);
    const request = new Request(this.hostsService.replaceHost(url), { headers });
    const res = await fetch(request);
    const { data } = await res.json();
    return data.type === 'premium';
  }

  async logout(): Promise<void> {
    const url = `${this.hostsService.niconicoAccount}/logout`;
    const request = new Request(this.hostsService.replaceHost(url), { credentials: 'same-origin' });
    const response = await fetch(request);
    await handleErrors(response);
  }

  get authUrl() {
    const host = this.hostsService.nAirLogin;
    return host;
  }

  get userSession() {
    return this.userService.apiToken;
  }

  get oauthToken() {
    return this.userService.platform.token;
  }

  get niconicoUserId() {
    return this.userService.platform.id;
  }

  /** 配信中番組ID
   */
  get channelId() {
    return this.userService.channelId;
  }
  getUserPageURL(): string {
    return 'http://live.nicovideo.jp/my';
  }

  getHeaders(authorized = false): Headers {
    const headers = new Headers();
    return headers;
  }

  get streamingStatus() {
    return this.streamingService.state.streamingStatus;
  }

  init() {
    console.log('niconico.init');
    this.streamingService.streamingStatusChange.subscribe(() => {
      console.log('streamingService.streamingStatusChange! ', this.streamingStatus);
      if (this.streamingStatus === EStreamingState.Reconnecting) {
        console.log('reconnecting - checking stream key');
        this.client.fetchBroadcastStream(this.channelId).catch(() => {
          console.log('niconico program has ended! stopping streaming.');
          this.streamingService.stopStreaming();
        });
      }
    });
  }

  /**
   * 有効な番組が選択されていれば、stream URL/key を設定し、その値を返す。
   * そうでなければ、ダイアログを出して選択を促すか、配信していない旨返す。
   * @param programId ユーザーが選択した番組ID(省略は未選択)
   */
  async setupStreamSettings(programId: string): Promise<IStreamingSetting> {
    try {
      // 直接returnしてしまうとcatchできないので一度awaitで受ける
      const result = await this._setupStreamSettings(programId);
      return result;
    } catch (e) {
      // APIのレスポンスに番組状態が反映されるのが遅れる場合があるので、少し待ってリトライ
      await sleep(3000);
    }

    try {
      const result = await this._setupStreamSettings(programId);
      return result;
    } catch (e) {
      // リトライは1回だけ
      return NiconicoService.emptyStreamingSetting();
    }
  }

  private async _setupStreamSettings(programId: string): Promise<IStreamingSetting> {
    const [stream, bitrate] = await Promise.all([
      this.client.fetchBroadcastStream(programId),
      this.client.fetchMaxBitrate(programId),
    ]);
    const url = stream.url;
    const key = stream.name;

    const settings = this.settingsService.getSettingsFormData('Stream');
    settings.forEach(subCategory => {
      if (subCategory.nameSubCategory !== 'Untitled') return;
      subCategory.parameters.forEach(parameter => {
        switch (parameter.name) {
          case 'service':
            parameter.value = 'niconico ニコニコ生放送';
            break;
          case 'server':
            parameter.value = url;
            break;
          case 'key':
            parameter.value = key;
            break;
        }
      });
    });
    this.settingsService.setSettings('Stream', settings);

    // 有効な番組が選択されているので stream keyを返す
    return NiconicoService.createStreamingSetting(url, key, bitrate);
  }

  private static emptyStreamingSetting(): IStreamingSetting {
    return NiconicoService.createStreamingSetting('', '');
  }

  private static createStreamingSetting(
    url: string,
    key: string,
    bitrate?: number,
  ): IStreamingSetting {
    return { url, key, bitrate };
  }

  // TODO ニコニコOAuthのtoken更新に使う
  async fetchNewToken(): Promise<void> {
    const url = `${this.hostsService.niconicoOAuth}/oauth2/token`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    const response = await fetch(request);
    const response_1 = await handleErrors(response);
    const response_2 = await response_1.json();
    return this.userService.updatePlatformToken(response_2.access_token);
  }
}
