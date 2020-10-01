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

type OnairUserProgramData = {
  programId: string;
  nextProgramId: string;
}

type OnairChannelProgramData = {
  testProgramId: string;
  programId: string;
  nextProgramId: string;
}

type OnairChannelsData = {
  id: string;
  name: string;
  ownerName: string;
  thumbnailUrl: string;
  smallThumbnailUrl: string;
}[];

type BroadcastStreamData = {
  url: string;
  name: string;
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
        this.fetchLiveProgramInfo(this.channelId).then(info => {
          let key = '';
          if (this.channelId && this.channelId in info) {
            key = info[this.channelId].key;
          }
          if (key === '') {
            console.log('niconico programas has ended! stopping streaming.');
            this.streamingService.stopStreaming();
          }
        });
      }
    });
  }

  /**
   * 有効な番組が選択されていれば、stream URL/key を設定し、その値を返す。
   * そうでなければ、ダイアログを出して選択を促すか、配信していない旨返す。
   * @param programId ユーザーが選択した番組ID(省略は未選択)
   */
  async setupStreamSettings(programId: string = ''): Promise<IStreamingSetting> {
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
      return NiconicoService.emptyStreamingSetting(false);
    }
  }

  private countBroadcastableChannelProgram(channels?: SocialGroup[]) {
    if (!channels) {
      return 0;
    }
    if (channels.length === 1) {
      return channels[0].broadcastablePrograms.length;
    }

    return channels.reduce((total, channel) => total + channel.broadcastablePrograms.length, 0);
  }

  private async _setupStreamSettings(programId: string = ''): Promise<IStreamingSetting> {
    const info = await this.fetchLiveProgramInfo(programId);
    console.log('fetchLiveProgramInfo: ' + JSON.stringify(info));

    const broadcastableComunityProgramNumber = info.community ? info.community.broadcastablePrograms.length : 0;
    const broadcastableChannnelProgramNumber = this.countBroadcastableChannelProgram(info.channels);
    const broadcastableProgramNumber = broadcastableComunityProgramNumber + broadcastableChannnelProgramNumber;

    // 配信可能番組がない場合
    if (broadcastableProgramNumber === 0) {
      // TODO: 配信可能番組がない場合について要検討
      throw new Error('no program');
    }

    // 放送可能な番組が複数ある場合は選択ダイアログを出す
    if (broadcastableProgramNumber > 1) {
      // show dialog and select
      this.windowsService.showWindow({
        componentName: 'NicoliveProgramSelector',
        queryParams: info,
        size: {
          width: 800,
          height: 800
        }
      });
      return NiconicoService.emptyStreamingSetting(true); // ダイアログでたから無視してね
    }

    // 以下、放送可能番組が1つの場合
    const broadcastableProgramInfo = broadcastableComunityProgramNumber === 1 ? info.community : info.channels[0];
    const socialGroupId = broadcastableProgramInfo.id;
    const broadcastableProgramId = broadcastableProgramInfo.broadcastablePrograms[0].id;
    const stream = await this.fetchBroadcastStream(broadcastableProgramId);
    const url = stream.url;
    const key = stream.name;
    const bitrate = await this.fetchMaxBitrate(broadcastableProgramId);
    this.userService.updatePlatformChannelId(socialGroupId);

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
    return NiconicoService.createStreamingSetting(false, url, key, bitrate);
  }

  private static emptyStreamingSetting(asking: boolean): IStreamingSetting {
    return NiconicoService.createStreamingSetting(asking, '', '');
  }

  private static createStreamingSetting(asking: boolean, url: string, key: string, bitrate?: number)
    : IStreamingSetting {
    return { asking, url, key, bitrate };
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
   * 放送可能なユーザー番組IDを取得する 
   */
  private fetchOnairUserProgram(): Promise<OnairUserProgramData> {
    const url = `${this.hostsService.niconicoRelive}/unama/tool/v2/onairs/user`
    const headers = this.getHeaders();
    headers.append('X-niconico-session', this.userService.apiToken);
    const request = new Request(url, { headers });
    return fetch(request).then(handleErrors).then(response => response.json()).then(json => json.data);
  }

  /**
   * 放送可能なチャンネル番組IDを取得する 
   * @param channelId チャンネルID(例： ch12345)
   */
  private fetchOnairChannelProgram(channelId: string): Promise<OnairChannelProgramData> {
    const url = `${this.hostsService.niconicoRelive}/unama/tool/v2/onairs/channels${channelId}`
    const headers = this.getHeaders();
    headers.append('X-niconico-session', this.userService.apiToken);
    const request = new Request(url, { headers });
    return fetch(request).then(handleErrors).then(response => response.json().then(json => json.data));
  }

  /**
   * 放送可能なチャンネル一覧を取得する 
   */
  private fetchOnairChannnels(): Promise<OnairChannelsData> {
    const url = `${this.hostsService.niconicoRelive}/unama/tool/v2/onairs/channels`
    const headers = this.getHeaders();
    headers.append('X-niconico-session', this.userService.apiToken);
    const request = new Request(url, { headers });
    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => { return json.data as OnairChannelsData });
  }

  /**
   * 指定番組IDのストリーム情報を取得する 
   * @param programId 番組ID(例： lv12345)
   */
  private fetchBroadcastStream(programId: string): Promise<BroadcastStreamData> {
    const url = `${this.hostsService.niconicoRelive}/unama/api/v2/programs/${programId}/broadcast_stream`;
    const headers = this.getHeaders();
    headers.append('X-niconico-session', this.userService.apiToken);
    const request = new Request(url, { headers });
    return fetch(request).then(handleErrors).then(response => response.json()).then(json => json.data);
  }

  /**
   *  放送可能な番組があるコミュニティを取得する
   */
  private async fetchBroadcastableCommunity(): Promise<SocialGroup | undefined> {
    try {
      const onairUserProgram = await this.fetchOnairUserProgram();
      const programInformation = await this.client.fetchProgram(onairUserProgram.programId);
      if (!isOk(programInformation)) {
        console.log('program not found');
        return undefined;
      }
      return {
        type: 'community',
        id: programInformation.value.socialGroup.id,
        name: programInformation.value.socialGroup.name,
        thumbnailUrl: programInformation.value.socialGroup.thumbnailUrl,
        broadcastablePrograms: [{ id: onairUserProgram.programId }]
      };
    } catch (e) {
      return undefined;
    }

  }

  /**
   *  放送可能な番組があるチャンネル一覧を取得する
   */
  private async fetchBroadcastableChannels(): Promise<SocialGroup[] | undefined> {
    const onairChannelsData = await this.fetchOnairChannnels();
    if (onairChannelsData.length === 0) {
      return undefined;
    }
    const channels = await Promise.all(onairChannelsData.map(async (channel) => {
      try {
        const programData = await this.fetchOnairChannelProgram(channel.id);
        return {
          type: 'channel',
          id: channel.id,
          name: channel.name,
          thumbnailUrl: channel.thumbnailUrl,
          broadcastablePrograms: Object.keys(programData).map(key => { return { id: programData[key] } })
        } as SocialGroup
      } catch (e) {
        return;
      }
    }));
    const filterdChannels = channels.filter(x => x); // undefinedを除く
    if (filterdChannels.length === 0) {
      return undefined;
    }
    return filterdChannels;
  }

  private async fetchMaxBitrate(programId: string): Promise<number> {
    const programInformation = await this.client.fetchProgram(programId);
    if (!isOk(programInformation)) {
      return 192;
    }
    switch (programInformation.value.streamSetting.maxQuality) {
      case '6Mbps720p':
        return 6000;
      case '2Mbps450p':
        return 2000;
      case '1Mbps450p':
        return 1000;
      case '384kbps288p':
        return 384;
      case '192kbps288p':
        return 192;
    }
  }

  /**
   * 指定したsocialGroupに指定したprogramIdが含まれているかどうか
   * @param socialGroup 検索対象のソーシャルグループ
   * @param programId 検索するprogramId
   */
  private hasProgram(socialGroup: SocialGroup, programId: string): boolean {
    return socialGroup.broadcastablePrograms.filter(program => program.id === programId).length > 1;
  }

  /**
   * 配信可能番組情報を取得する。
   * @param programId 与えた場合、一致する番組があればその情報だけを返す。
   *   無い場合と与えない場合、配信可能な全番組を返す。
   */
  async fetchLiveProgramInfo(programId: string = ''): Promise<LiveProgramInfo> {
    const broadcastableCommunity = await this.fetchBroadcastableCommunity();
    const broadcastableChannels = await this.fetchBroadcastableChannels();
    if (programId !== '') {
      if (broadcastableCommunity && this.hasProgram(broadcastableCommunity, programId)) {
        return {
          community: broadcastableCommunity,
        };
      }
      const matchedChannel = broadcastableChannels && broadcastableChannels.reduce((_result, channel) => {
        if (this.hasProgram(channel, programId)) {
          return channel;
        }
      }, undefined);
      if (matchedChannel) {
        return {
          channels: [matchedChannel]
        };
      }
    }

    return {
      community: broadcastableCommunity,
      channels: broadcastableChannels
    };
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

