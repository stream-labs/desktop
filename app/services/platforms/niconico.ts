import { StatefulService, mutation } from './../stateful-service';
import { IPlatformService, IPlatformAuth, IChannelInfo } from '.';
import { HostsService } from '../hosts';
import { SettingsService } from '../settings';
import { Inject } from '../../util/injector';
import { handleErrors, requiresToken, authorizedHeaders } from '../../util/requests';
import { UserService } from '../user';
import { integer } from 'aws-sdk/clients/cloudfront';
import { parseString } from 'xml2js';
import { StreamingService, EStreamingState } from '../streaming';

interface INiconicoServiceState {
  typeIdMap: object;
}

function parseXml(xml: String): Promise<object> {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) {
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
    }
    console.log(this);
  }

  static fromXml(xmlString: string): Promise<GetPublishStatusResult> {
    return parseXml(xmlString).then(obj => new GetPublishStatusResult(obj));
  }
}

export class NiconicoService extends StatefulService<INiconicoServiceState> implements IPlatformService {

  @Inject() hostsService: HostsService;
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;
  @Inject() streamingService: StreamingService;

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 800,
  };

  static initialState: INiconicoServiceState = {
    typeIdMap: {},
  };

  @mutation()
  private ADD_GAME_MAPPING(game: string, id: integer) {
    this.state.typeIdMap[game] = id;
  }

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
      .then(() => {});
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
        this.fetchStreamUrlAndKey().then(({ url, key }) => {
          if (key === '') {
            console.log('niconico programas has ended! stopping streaming.');
            this.streamingService.stopStreaming();
          }
        });
      }
    });
  }

  setupStreamSettings(auth: IPlatformAuth) {
    return this.fetchStreamUrlAndKey().then(({ url, key }) => {
      const settings = this.settingsService.getSettingsFormData('Stream');
      console.log('fetchStreamUrlAndKey: ' + JSON.stringify({ url, key }));
      settings.forEach(subCategory => {
        subCategory.parameters.forEach(parameter => {
          if (parameter.name === 'service') {
            parameter.value = 'niconico ニコニコ生放送';
          }

          if (parameter.name === 'server') {
            parameter.value = url;
          }
          if (parameter.name === 'key') {
            parameter.value = key;
          }
        });
      });

      this.settingsService.setSettings('Stream', settings);
    });
  }

  // TODO ニゴニコOAuthのtoken更新に使う
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
      .then(xml => GetPublishStatusResult.fromXml(xml))
      .then(result => {
        if (result.ok) {
          this.userService.updatePlatformChannelId(result.items[0].stream[0].id[0]); // lv-id
        }
        return result;
      });
  }

  fetchStreamUrlAndKey(): Promise<{ url: string, key: string }> {
    return this.fetchRawChannelInfo().then(result => {
      const status = result.status;
      console.log('getpublishstatus status=' + status);
      if (status === 'ok') {
        const rtmp = result.items[0].rtmp[0];
        return { url: rtmp.url[0], key: rtmp.stream[0] };
      }
      return { url: '', key: '' };
    });
  }
  fetchStreamKey(): Promise<string> {
    return this.fetchStreamUrlAndKey().then(urlkey => urlkey.key);
  }

  fetchBitrate(): Promise<number | undefined> {
    return this.fetchRawChannelInfo().then(result => {
      const status = result.status;
      console.log('getpublishstatus status=' + status);
      if (status === 'ok') {
        return parseInt(result.items[0].rtmp[0].bitrate[0], 10);
      }
      return undefined;
    });
  }

  fetchChannelInfo(): Promise<IChannelInfo> {
    return this.fetchRawChannelInfo().then(json => {
      return {
        title: '', // TODO
        game: ''
      };
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
      .then(o => o['stream'][0]['watch_count'][0]);
  }

  @requiresToken()
  fetchCommentCount(): Promise<number> {
    return this.fetchPlayerStatus()
      .then(o => o['stream'][0]['comment_count'][0]);
  }

  @requiresToken()
  putChannelInfo(streamTitle: string, streamGame: string): Promise<boolean> {
    // dummy. ignore it.
    return Promise.resolve(false);
  }

  searchGames(searchString: string) {
    return Promise.resolve(JSON.parse(''));
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

