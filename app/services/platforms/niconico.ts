import { Service } from './../service';
import { IPlatformService, IStreamingSetting } from '.';
import { HostsService } from '../hosts';
import { SettingsService } from '../settings';
import { Inject } from '../../util/injector';
import { sleep } from 'util/sleep';
import { handleErrors, requiresToken, authorizedHeaders } from '../../util/requests';
import { UserService } from '../user';
import { Builder, parseString } from 'xml2js';
import { StreamingService, EStreamingState } from '../streaming';
import { WindowsService } from 'services/windows';

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

type StreamInfo = {
  id?: string[];
  exclude?: string[];
  title?: string[];
  description?: string[];
};
type RtmpInfo = {
  url?: string[];
  stream?: string[];
  ticket?: string[];
  bitrate?: string[];
};
type ProgramInfo = {
  stream: StreamInfo[];
  rtmp: RtmpInfo[];
};
class UserInfo {
  nickname: string | undefined;
  isPremium: number;
  userId: string | undefined;
  NLE: number;

  constructor(obj: object) {
    this.nickname = obj['nickname'][0];
    this.isPremium = parseInt(obj['is_premium'][0], 10);
    this.userId = obj['user_id'][0];
    this.NLE = parseInt(obj['NLE'][0], 10);
  }
}

export type LiveProgramInfo = Dictionary<{
  title: string,
  description: string,
  bitrate: number | undefined,
  url: string,
  key: string
}>

class GetPublishStatusResult {
  attrib: object;
  items?: ProgramInfo[];
  user?: UserInfo;

  get status(): string {
    return this.attrib['status'];
  }
  get ok(): boolean {
    return this.status === 'ok';
  }
  get multi(): boolean {
    return this.attrib['multi'] === 'true';
  }

  constructor(obj: object) {
    console.log('getpublishstatus => ', JSON.stringify(obj)); // DEBUG
    console.log('getpublishstatus => ', obj); // DEBUG

    if (!('getpublishstatus' in obj)) {
      throw 'invalid response from getpublishstatus';
    }
    const getpublishstatus = obj['getpublishstatus'];
    this.attrib = getpublishstatus['$'];
    if (this.ok) {
      if (this.multi) {
        this.items = getpublishstatus['list'][0]['item'] as ProgramInfo[];
      } else {
        this.items = [getpublishstatus as ProgramInfo];
      }
      this.user = new UserInfo(getpublishstatus['user'][0]);

      // convert items[].stream[].description to XML string
      const xml = new Builder({rootName: 'root', headless: true});
      const removeRoot = (s: string): string => s.replace(/^<root>([\s\S]*)<\/root>$/, '$1');
      for (const p of this.items) {
        for (const s of p.stream) {
          if ('description' in s) {
            s.description = s.description.map(d => removeRoot(xml.buildObject(d)));
          }
        }
      }
    }
    console.log(this);
  }

  static fromXml(xmlString: string): Promise<GetPublishStatusResult> {
    return parseXml(xmlString).then(obj => new GetPublishStatusResult(obj));
  }
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

  private async _setupStreamSettings(programId: string = ''): Promise<IStreamingSetting> {
    const info = await this.fetchLiveProgramInfo(programId);
    console.log('fetchLiveProgramInfo: ' + JSON.stringify(info));

    const num = Object.keys(info).length;
    if (num > 1) {
      // show dialog and select
      this.windowsService.showWindow({
        componentName: 'NicoliveProgramSelector',
        queryParams: info,
        size: {
          width: 700,
          height: 400
        }
      });
      return NiconicoService.emptyStreamingSetting(true); // ダイアログでたから無視してね
    }
    if (num < 1) {
      // 番組がない
      throw new Error('no program');
    }
    const id = Object.keys(info)[0];
    const selected = info[id];
    const url = selected.url;
    const key = selected.key;
    const bitrate = selected.bitrate;
    this.userService.updatePlatformChannelId(id);

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
    const url = `${this.hostsService.niconicoOAuth}/token`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(response =>
        this.userService.updatePlatformToken(response.access_token)
      );
  }

  private fetchGetPublishStatus(): Promise<string> {
    const headers = this.getHeaders(true);
    const request = new Request(
      `${this.hostsService.niconicolive}/api/getpublishstatus?accept-multi=1`,
      { headers, credentials: 'include' }
    );

    return fetch(request)
      .then(handleErrors)
      .then(response => response.text());
  }

  @requiresToken()
  fetchRawChannelInfo(): Promise<GetPublishStatusResult> {
    return this.fetchGetPublishStatus()
      .then(xml => GetPublishStatusResult.fromXml(xml));
  }

  /**
   * 配信可能番組情報を取得する。
   * @param programId 与えた場合、一致する番組があればその情報だけを返す。
   *   無い場合と与えない場合、配信可能な全番組を返す。
   */
  fetchLiveProgramInfo(programId: string = ''): Promise<LiveProgramInfo> {
    return this.fetchRawChannelInfo().then(result => {
      const status = result.status;
      console.log('getpublishstatus status=' + status);
      let r: LiveProgramInfo = {};
      if (status === 'ok') {
        for (const item of result.items) {
          const rtmp = item.rtmp[0];
          const stream = item.stream[0];
          const id = stream.id[0];
          r[id] = {
            title: stream.title[0],
            description: stream.description[0],
            bitrate: rtmp.bitrate.length > 0 ? parseInt(rtmp.bitrate[0], 10) : undefined,
            url: rtmp.url[0].trim(),
            key: rtmp.stream[0].trim()
          };
        };
        if (programId && programId in r) {
          r = { [programId]: r[programId] };
        }
      }
      return r;
    });
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

  getChatUrl(mode: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.fetchRawChannelInfo()
        .then(json => {
          reject('not yet supported for chat');
        });
    });
  }
}

