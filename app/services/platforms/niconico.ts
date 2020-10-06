import { Service } from 'services/service';
import { IPlatformService, IStreamingSetting } from '.';
import { HostsService } from 'services/hosts';
import { SettingsService } from 'services/settings';
import { Inject } from 'util/injector';
import { sleep } from 'util/sleep';
import { handleErrors, requiresToken, authorizedHeaders } from 'util/requests';
import { UserService } from 'services/user';
import { Builder, parseString } from 'xml2js';
import { StreamingService, EStreamingState } from 'services/streaming';
import { WindowsService } from 'services/windows';
import { NicoliveClient, isOk } from 'services/nicolive-program/NicoliveClient';

export type INiconicoProgramSelection = {
  info: LiveProgramInfo
  selectedId: string
}

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
}

export type LiveProgramInfo = {
  community?: SocialGroup;
  channels?: SocialGroup[];
}


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

  getUserKey(): Promise<string> {
    const url = `${this.hostsService.niconicoFlapi}/getuserkey`;
    const request = new Request(url, { credentials: 'same-origin' });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.text())
      .then(text => {
        if (text.startsWith('userkey=')) {
          return text.substr('userkey='.length);
        }
        return '';
      });
  }
  isLoggedIn(): Promise<boolean> {
    return this.getUserKey().then(userkey => userkey !== '');
  }

  isPremium(token: string): Promise<boolean> {
    const url = `${this.hostsService.niconicoOAuth}/v1/user/premium.json`;
    const headers = authorizedHeaders(token);
    const request = new Request(url, { headers });
    return fetch(request)
      .then(res => res.json())
      .then(({ data }) => {
        return data.type === 'premium';
      });
  }

  logout(): Promise<void> {
    const url = `${this.hostsService.niconicoAccount}/logout`;
    const request = new Request(url, { credentials: 'same-origin' });
    return fetch(request)
      .then(handleErrors)
      .then(() => { });
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
    return `http://www.nicovideo.jp/user/${this.niconicoUserId}`;
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
          console.log('niconico programas has ended! stopping streaming.');
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
    const stream = await this.client.fetchBroadcastStream(programId);
    const url = stream.url;
    const key = stream.name;
    const bitrate = await this.client.fetchMaxBitrate(programId);

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

  private static createStreamingSetting(url: string, key: string, bitrate?: number)
    : IStreamingSetting {
    return { url, key, bitrate };
  }

  // TODO ニコニコOAuthのtoken更新に使う
  fetchNewToken(): Promise<void> {
    const url = `${this.hostsService.niconicoOAuth}/oauth2/token`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(response =>
        this.userService.updatePlatformToken(response.access_token)
      );
  }

  /**

  async fetchBroadcastableProgramId(): Promise<string | undefined> {
    const broadcastableUserProgramId = await this.fetchOnairUserProgram();
    const broadcastableChannelId = await this.fetchOnairChannnels();
    console.log('=================userprogram', broadcastableUserProgramId);
    console.log('=================channel', broadcastableChannelId);
    // 配信可能な番組がない場合
    if (!broadcastableUserProgramId.programId && broadcastableChannelId.length === 0) {
      return Promise.reject("no program");
    }

    // ユーザ番組のみ配信可能
    if (broadcastableUserProgramId.programId && broadcastableChannelId.length === 0) {
      console.log('=========================user only')
      return broadcastableUserProgramId.programId;
    }

    // 配信可能なユーザ番組がないが配信可能なチャンネルがある場合
    if (!broadcastableUserProgramId.programId && broadcastableChannelId.length > 0) {
      const broadcastableChannelProgramId = await this.fetchOnairChannelProgram(broadcastableChannelId[0].id);
      const programIds = Object.keys(broadcastableChannelProgramId).map((key) => {
        return broadcastableChannelProgramId[key];
      });
      // 配信可能なチャンネル番組が一つだけの場合
      if (programIds.length === 1) {
        return programIds[0];
      } else {
        return undefined;
      }
    }

    // 配信可能なユーザ番組があり、配信可能なチャンネルがある場合
    return undefined;
  }

  /**
   * getplayerstatusを叩く
   * 将来的にAPIはN Air向けのものに移行する予定で、暫定的な実装
   */
  @requiresToken()
  private fetchPlayerStatus() {
    const headers = this.getHeaders(true);
    const request = new Request(
      `${this.hostsService.niconicolive}/api/getplayerstatus?v=${this.channelId}`,
      { headers, credentials: 'include' }
    );

    return fetch(request)
      .then(handleErrors)
      .then(response => response.text())
      .then(xml => parseXml(xml))
      .then(json => {
        console.log('getplayerstatus => ', JSON.stringify(json)); // DEBUG
        if (!('getplayerstatus' in json)) {
          throw 'invalid response from getplayerstatus';
        }
        const getplayerstatus = json['getplayerstatus'];
        return getplayerstatus;
      });
  }

  @requiresToken()
  fetchViewerCount(): Promise<number> {
    return this.fetchPlayerStatus()
      .then(o => {
        return o['stream'][0]['watch_count'][0]
      });
  }

  @requiresToken()
  fetchCommentCount(): Promise<number> {
    return this.fetchPlayerStatus()
      .then(o => {
        return o['stream'][0]['comment_count'][0];
      });
  }
}

