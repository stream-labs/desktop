import * as Sentry from '@sentry/vue';
import { ipcRenderer, remote } from 'electron';
import { addClipboardMenu } from 'util/addClipboardMenu';
import { handleErrors } from 'util/requests';
import {
  BroadcastStreamData,
  CommonErrorResponse,
  Communities,
  Community,
  Extension,
  FilterRecord,
  Filters,
  NicoadStatistics,
  OnairChannelData,
  OnairChannelProgramData,
  OnairUserProgramData,
  ProgramInfo,
  ProgramSchedules,
  Segment,
  Statistics,
  UserFollowStatus,
  UserFollow,
  AddFilterRecord,
  AddFilterResult
} from './ResponseTypes';
const { BrowserWindow } = remote;

export enum CreateResult {
  CREATED = 'CREATED',
  RESERVED = 'RESERVED',
  OTHER = 'OTHER',
}

export enum EditResult {
  EDITED = 'EDITED',
  OTHER = 'OTHER',
}

interface HeaderSeed {
  [key: string]: string;
}

type SucceededResult<T> = {
  ok: true;
  value: T;
};

export type FailedResult = {
  ok: false;
  value: CommonErrorResponse | Error;
};

/**
 * JSONで結果が返ってくることまでを信用したEitherのようなもの
 * @example
 * declare var result: WrappedResult<number>;
 * if (isOk(result)) result.value; // number
 * else result.value // CommonErrorResponse
 */
export type WrappedResult<T> = SucceededResult<T> | FailedResult;

export function isOk<T>(result: WrappedResult<T>): result is SucceededResult<T> {
  return result.ok === true;
}

export class NotLoggedInError { }

type Quality = {
  bitrate: number;
  height: number;
  fps: number;
};

export function parseMaxQuality(maxQuality: string, fallback: Quality): Quality {
  try {
    const match = maxQuality.match(/(\d+)([Mk])bps(\d+)p((\d+)fps)?/);

    return {
      bitrate: parseInt(match[1], 10) * (match[2] === 'M' ? 1000 : 1),
      height: parseInt(match[3], 10),
      fps: parseInt(match[5], 10) || 30,
    };
  } catch (e) {
    console.warn('Failed to parse max quality', maxQuality, e);
    return fallback;
  }
}

export type KonomiTag = {
  tag_id: {
    value: string;
  }
  name: string;
  followers_count: number;
};
type KonomiTags = {
  konomi_tags: KonomiTag[];
}

function isValidUserFollowResponse(response: any): response is UserFollow {
  if (typeof response !== 'object') return false;
  if (!('meta' in response)) return false;
  if (typeof response['meta'] !== 'object') return false;
  if (!('status' in response['meta'])) return false;
  if (typeof response['meta']['status'] !== 'number') return false;
  return true;
}

function isValidUserFollowStatusResponse(response: any): response is UserFollowStatus {
  if (!isValidUserFollowResponse(response)) return false;
  if (response.meta.status !== 200) return false;
  if (!('data' in response)) return false;
  if (typeof response['data'] !== 'object') return false;
  if (!('following' in (response as { data: any })['data'])) return false;
  if (typeof (response as { data: any })['data']['following'] !== 'boolean') return false;
  return true;
}

export class NicoliveClient {
  static live2BaseURL = 'https://live2.nicovideo.jp';
  static live2ApiBaseURL = 'https://api.live2.nicovideo.jp';
  static publicBaseURL = 'https://public.api.nicovideo.jp';
  static nicoadBaseURL = 'https://api.nicoad.nicovideo.jp';
  static communityBaseURL = 'https://com.nicovideo.jp';
  static userFollowBaseURL = 'https://user-follow-api.nicovideo.jp';
  private static frontendID = 134;

  static isProgramPage(url: string): boolean {
    return /^https?:\/\/live2?\.nicovideo\.jp\/watch\/lv\d+/.test(url);
  }

  static isMyPage(url: string): boolean {
    const urlObj = new URL(url);
    return (
      /^https?:$/.test(urlObj.protocol) &&
      /^live2?\.nicovideo\.jp$/.test(urlObj.hostname) &&
      /^\/my$/.test(urlObj.pathname)
    );
  }

  static isAllowedURL(url: string): boolean {
    return /^https?:\/\/live2?.nicovideo.jp\//.test(url);
  }

  private static createRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    requestInit: RequestInit,
  ): RequestInit {
    return {
      method,
      mode: 'cors',
      credentials: 'include',
      ...requestInit,
    };
  }

  static async wrapResult<ResultType>(res: Response): Promise<WrappedResult<ResultType>> {
    const body = await res.text();
    let obj: any = null;
    try {
      obj = JSON.parse(body);
    } catch (e) {
      // bodyがJSONになってない異常失敗

      // breadcrumbsに載るようにログ
      console.warn('non-json body', body);
      return {
        ok: false,
        value: e as Error,
      };
    }

    // 正常成功
    if (res.ok) {
      return {
        ok: true,
        value: obj.data as ResultType,
      };
    }

    // 正常失敗
    return {
      ok: false,
      value: obj as CommonErrorResponse,
    };
  }

  static async wrapFetchError(err: Error): Promise<FailedResult> {
    return {
      ok: false,
      value: err,
    };
  }

  /**
   * ニコニコのセッションを読みだし
   * rendererのdocument.cookieからはローカル扱いになって読めないので、mainプロセスで取る
   */
  private async fetchSession(): Promise<string> {
    const { session } = remote.getCurrentWebContents();
    return new Promise((resolve, reject) => {
      session.cookies.get(
        { url: 'https://.nicovideo.jp', name: 'user_session' },
        (err, cookies) => {
          if (err) return reject(err);
          if (cookies.length < 1) return reject(new NotLoggedInError());
          resolve(cookies[0].value);
        },
      );
    });
  }

  private get(url: string | URL, options: RequestInit = {}): Promise<Response> {
    return fetch(url.toString(), NicoliveClient.createRequest('GET', options));
  }

  private post(url: string | URL, options: RequestInit = {}): Promise<Response> {
    return fetch(url.toString(), NicoliveClient.createRequest('POST', options));
  }

  private put(url: string | URL, options: RequestInit = {}): Promise<Response> {
    return fetch(url.toString(), NicoliveClient.createRequest('PUT', options));
  }

  private delete(url: string | URL, options: RequestInit = {}): Promise<Response> {
    return fetch(url.toString(), NicoliveClient.createRequest('DELETE', options));
  }

  /** ユーザごとの番組スケジュールを取得 */
  async fetchProgramSchedules(
    headers?: HeaderSeed,
  ): Promise<WrappedResult<ProgramSchedules['data']>> {
    try {
      const res = await this.get(`${NicoliveClient.live2BaseURL}/unama/tool/v1/program_schedules`, {
        headers,
      });
      return NicoliveClient.wrapResult<ProgramSchedules['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }
  }

  /** 番組情報を取得 */
  async fetchProgram(
    programID: string,
    headers?: HeaderSeed,
  ): Promise<WrappedResult<ProgramInfo['data']>> {
    try {
      const res = await this.get(`${NicoliveClient.live2BaseURL}/watch/${programID}/programinfo`, {
        headers,
      });
      return NicoliveClient.wrapResult<ProgramInfo['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }
  }

  /** 番組を開始 */
  async startProgram(
    programID: string,
    headers?: HeaderSeed,
  ): Promise<WrappedResult<Segment['data']>> {
    try {
      const res = await this.put(`${NicoliveClient.live2BaseURL}/watch/${programID}/segment`, {
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'on_air' }),
      });

      return NicoliveClient.wrapResult<Segment['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }
  }

  /** 番組を終了 */
  async endProgram(
    programID: string,
    headers?: HeaderSeed,
  ): Promise<WrappedResult<Segment['data']>> {
    try {
      const res = await this.put(`${NicoliveClient.live2BaseURL}/watch/${programID}/segment`, {
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'end' }),
      });

      return NicoliveClient.wrapResult<Segment['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }
  }

  /** 番組を延長 */
  async extendProgram(
    programID: string,
    minutes: number = 30,
    headers?: HeaderSeed,
  ): Promise<WrappedResult<Extension['data']>> {
    try {
      const res = await this.post(`${NicoliveClient.live2BaseURL}/watch/${programID}/extension`, {
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      });

      return NicoliveClient.wrapResult<Extension['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }
  }

  /** 運営コメントを送信 */
  async sendOperatorComment(
    programID: string,
    { text, isPermanent }: { text: string; isPermanent?: boolean },
    headers?: HeaderSeed,
  ): Promise<WrappedResult<void>> {
    try {
      const res = await this.put(
        `${NicoliveClient.live2BaseURL}/watch/${programID}/operator_comment`,
        {
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, isPermanent }),
        },
      );

      return NicoliveClient.wrapResult<void>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }
  }

  /** 統計情報（視聴者とコメント数）を取得 */
  async fetchStatistics(
    programID: string,
    headers?: HeaderSeed,
  ): Promise<WrappedResult<Statistics['data']>> {
    try {
      const res = await this.get(`${NicoliveClient.live2BaseURL}/watch/${programID}/statistics`, {
        headers,
      });

      return NicoliveClient.wrapResult<Statistics['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }
  }

  // 関心が別だが他の場所におく程の理由もないのでここにおく
  /**
   * ニコニ広告ptとギフトptを取得
   * 放送開始前は404になる
   **/
  async fetchNicoadStatistics(
    programID: string,
    headers?: HeaderSeed,
  ): Promise<WrappedResult<NicoadStatistics['data']>> {
    try {
      const res = await this.get(
        `${NicoliveClient.nicoadBaseURL}/v1/live/statusarea/${programID}`,
        { headers },
      );

      return NicoliveClient.wrapResult<NicoadStatistics['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }
  }

  async fetchFilters(programID: string): Promise<WrappedResult<Filters['data']>> {
    const session = await this.fetchSession();
    const requestInit = NicoliveClient.createRequest('GET', {
      headers: {
        'X-Niconico-Session': session,
        'Content-Type': 'application/json',
      },
    });
    try {
      const resp = await fetch(
        `${NicoliveClient.live2BaseURL}/unama/tool/v2/programs/${programID}/ssng`,
        requestInit,
      );
      return NicoliveClient.wrapResult<Filters['data']>(resp);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }
  }

  async addFilters(
    programID: string,
    records: AddFilterRecord[],
  ): Promise<WrappedResult<AddFilterResult['data']>> {
    const session = await this.fetchSession();
    if (records.length !== 1) {
      throw new Error('addFilters: records.length must be 1');
    }
    const requestInit = NicoliveClient.createRequest('POST', {
      body: JSON.stringify(records[0]),
      headers: {
        'X-Niconico-Session': session,
        'Content-Type': 'application/json',
      },
    });
    try {
      const resp = await fetch(
        `${NicoliveClient.live2BaseURL}/unama/tool/v2/programs/${programID}/ssng/create`,
        requestInit,
      );
      return NicoliveClient.wrapResult<AddFilterResult['data']>(resp);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }
  }

  async deleteFilters(programID: string, ids: FilterRecord['id'][]): Promise<WrappedResult<void>> {
    const session = await this.fetchSession();
    const requestInit = NicoliveClient.createRequest('DELETE', {
      body: JSON.stringify({
        id: ids,
      }),
      headers: {
        'X-Niconico-Session': session,
        'Content-Type': 'application/json',
      },
    });
    try {
      const resp = await fetch(
        `${NicoliveClient.live2BaseURL}/unama/tool/v2/programs/${programID}/ssng`,
        requestInit,
      );
      return NicoliveClient.wrapResult<void>(resp);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }
  }

  // 関心が別だが他の場所におく程の理由もないのでここにおく
  /** ユーザーアイコンを取得 */
  static getUserIconURL(userId: string, hash: string): string {
    const dir = Math.floor(Number(userId) / 10000);
    const url = `https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/${dir}/${userId}.jpg?${hash}`
    return url;
  }
  static defaultUserIconURL = 'https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg';

  // 関心が別だが他の場所におく程の理由もないのでここにおく
  /** コミュニティ情報を取得 */
  async fetchCommunity(
    communityId: string,
    headers?: HeaderSeed,
  ): Promise<WrappedResult<Community>> {
    const url = new URL(`${NicoliveClient.communityBaseURL}/api/v2/communities.json`);
    const communityNo = communityId.replace(/^co/, '');
    const params = {
      ids: communityNo,
    };
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    let res = null;
    try {
      res = await this.get(url, {
        headers: {
          ...headers,
          'X-Frontend-Id': NicoliveClient.frontendID.toString(10),
        },
      });
    } catch (err) {
      return NicoliveClient.wrapFetchError(err as Error);
    }

    const body = await res.text();
    let obj: any = null;
    try {
      obj = JSON.parse(body);
    } catch (e) {
      // bodyがJSONになってない異常失敗

      // breadcrumbsに載るようにログ
      console.warn('non-json body', body);
      return {
        ok: false,
        value: e as Error,
      };
    }

    if (res.ok) {
      const data = obj.data as Communities['data'];
      const communities = data.communities?.communities || [];

      const community = communities.find(c => c.global_id === communityId);
      if (community) {
        // 正常成功
        return {
          ok: true,
          value: community,
        };
      } else {
        // community not found
        return {
          ok: false,
          value: {
            meta: {
              status: 404,
              errorCode: 'NOT_FOUND',
              errorMessage: `community ${communityId} not found`,
            },
          } as CommonErrorResponse,
        };
      }
    }

    // 正常失敗
    return {
      ok: false,
      value: obj as CommonErrorResponse,
    };
  }
  /*
   * 放送可能なユーザー番組IDを取得する
   * 放送可能な番組がない場合はundefinedを返す
   */
  async fetchOnairUserProgram(): Promise<OnairUserProgramData> {
    const url = `${NicoliveClient.live2BaseURL}/unama/tool/v2/onairs/user`;
    const headers = new Headers();
    const userSession = await this.fetchSession();
    headers.append('X-niconico-session', userSession);
    const request = new Request(url, { headers });
    return await fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => json.data);
  }

  /**
   * 放送可能なチャンネル番組IDを取得する
   * @param channelId チャンネルID(例： ch12345)
   */
  async fetchOnairChannelProgram(
    channelId: string,
  ): Promise<WrappedResult<OnairChannelProgramData>> {
    const url = `${NicoliveClient.live2BaseURL}/unama/tool/v2/onairs/channels/${channelId}`;
    const headers = new Headers();
    try {
      const userSession = await this.fetchSession();
      headers.append('X-niconico-session', userSession);
      const request = new Request(url, { headers });
      const response = await fetch(request);
      return NicoliveClient.wrapResult<OnairChannelProgramData>(response);
    } catch (error) {
      return NicoliveClient.wrapFetchError(error as Error);
    }
  }

  /**
   * 放送可能なチャンネル一覧を取得する
   */
  async fetchOnairChannels(): Promise<WrappedResult<OnairChannelData[]>> {
    const url = `${NicoliveClient.live2BaseURL}/unama/tool/v2/onairs/channels`;
    const headers = new Headers();
    try {
      const userSession = await this.fetchSession();
      headers.append('X-niconico-session', userSession);
      const response = await fetch(new Request(url, { headers }));
      return NicoliveClient.wrapResult<OnairChannelData[]>(response);
    } catch (error) {
      return NicoliveClient.wrapFetchError(error as Error);
    }
  }

  /**
   * 指定番組IDのストリーム情報を取得する
   * @param programId 番組ID(例： lv12345)
   */
  async fetchBroadcastStream(programId: string): Promise<BroadcastStreamData> {
    const url = `${NicoliveClient.live2BaseURL}/unama/api/v2/programs/${programId}/broadcast_stream`;
    const headers = new Headers();
    const userSession = await this.fetchSession();
    headers.append('X-niconico-session', userSession);
    const request = new Request(url, { headers });
    return fetch(request)
      .then(handleErrors)
      .then(response => response.json())
      .then(json => json.data);
  }

  async fetchMaxQuality(programId: string): Promise<Quality> {
    const fallback: Quality = { bitrate: 192, height: 288, fps: 30 } as const;
    const programInformation = await this.fetchProgram(programId);
    if (!isOk(programInformation)) {
      return fallback;
    }

    return parseMaxQuality(programInformation.value.streamSetting.maxQuality, fallback);
  }

  /** 番組作成画面を開いて結果を返す */
  async createProgram(): Promise<CreateResult> {
    const win = new BrowserWindow({
      width: 1200,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        nativeWindowOpen: true,
      },
    });
    win.removeMenu();
    Sentry.addBreadcrumb({
      category: 'createProgram.open',
    });
    return new Promise<CreateResult>((resolve, _reject) => {
      addClipboardMenu(win);
      win.on('closed', () => resolve(CreateResult.OTHER));
      win.webContents.on('did-navigate', (_event, url) => {
        Sentry.addBreadcrumb({
          category: 'createProgram.did-navigate',
          message: url,
        });
        if (NicoliveClient.isProgramPage(url)) {
          resolve(CreateResult.CREATED);
          win.close();
        } else if (NicoliveClient.isMyPage(url)) {
          resolve(CreateResult.RESERVED);
          win.close();
        } else if (!NicoliveClient.isAllowedURL(url)) {
          Sentry.withScope(scope => {
            scope.setLevel('warning');
            scope.setExtra('url', url);
            scope.setFingerprint(['createProgram', 'did-navigate', url]);
            Sentry.captureMessage('createProgram did-navigate to unexpected URL');
          });
          resolve(CreateResult.OTHER);
          remote.shell.openExternal(url);
          win.close();
        }
      });
      ipcRenderer.send('window-preventLogout', win.id);
      ipcRenderer.send('window-preventNewWindow', win.id);
      const url = 'https://live.nicovideo.jp/create';
      win.loadURL(url)?.catch(error => {
        if (error instanceof Error) {
          Sentry.withScope(scope => {
            scope.setLevel('warning');
            scope.setExtra('url', url);
            scope.setFingerprint(['createProgram', 'loadURL', url]);
            Sentry.captureException(error);
          });
        }
      });
    }).then(result => {
      Sentry.addBreadcrumb({
        category: 'createProgram.close',
        message: result,
      });
      return result;
    });
  }

  private editProgramWindow: Electron.BrowserWindow = null;
  private editProgramId = '';

  /** 番組編集画面を開いて結果を返す */
  async editProgram(programID: string): Promise<EditResult> {
    if (this.editProgramWindow) {
      if (this.editProgramId === programID) {
        this.editProgramWindow.focus();
        return EditResult.OTHER;
      }
      this.editProgramWindow.close();
    }
    const win = new BrowserWindow({
      width: 1200,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        nativeWindowOpen: true,
      },
    });
    win.removeMenu();
    this.editProgramWindow = win;
    this.editProgramId = programID;
    Sentry.addBreadcrumb({
      category: 'editProgram.open',
      message: programID,
    });

    return new Promise<EditResult>((resolve, _reject) => {
      addClipboardMenu(win);
      win.on('closed', () => {
        this.editProgramWindow = null;
        this.editProgramId = '';
        resolve(EditResult.OTHER);
      });
      win.webContents.on('did-navigate', (_event, url) => {
        if (NicoliveClient.isProgramPage(url) || NicoliveClient.isMyPage(url)) {
          resolve(EditResult.EDITED);
          win.close();
        } else if (!NicoliveClient.isAllowedURL(url)) {
          Sentry.withScope(scope => {
            scope.setLevel('warning');
            scope.setExtra('url', url);
            scope.setTag('programID', programID);
            scope.setFingerprint(['editProgram', 'did-navigate', url]);
            Sentry.captureMessage('editProgram did-navigate to unexpected URL');
          });
          resolve(EditResult.OTHER);
          remote.shell.openExternal(url);
          win.close();
        }
      });
      ipcRenderer.send('window-preventLogout', win.id);
      ipcRenderer.send('window-preventNewWindow', win.id);
      const url = `https://live.nicovideo.jp/edit/${programID}`;
      win.loadURL(url)?.catch(error => {
        if (error instanceof Error) {
          Sentry.withScope(scope => {
            scope.setLevel('warning');
            scope.setExtra('url', url);
            scope.setTag('programID', programID);
            scope.setFingerprint(['editProgram', 'loadURL', url]);
            Sentry.captureException(error);
          });
        }
      });
    }).then(result => {
      Sentry.addBreadcrumb({
        category: 'editProgram.close',
        message: result,
      });
      return result;
    });
  }

  // 関心が別だが他の場所におく程の理由もないのでここにおく
  /**
   * ユーザーの好みタグを取得する
   * @param userId 
   * @returns 
   */
  async fetchKonomiTags(userId: string): Promise<KonomiTag[]> {
    const res = await this.post(
      `${NicoliveClient.live2ApiBaseURL}/api/v1/konomiTags/GetFollowing`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-service-id': 'n-air-app',
        },
        body: JSON.stringify({ 'follower_id': { value: userId, type: 'USER' } }),
      },
    );
    if (res.ok) {
      const json = await res.json() as KonomiTags;
      return json.konomi_tags;
    }
    throw new Error(`fetchKonomiTags failed: ${res.status} ${res.statusText}`);
  }

  static userFollowEndpoint(userId: string): string {
    return `${NicoliveClient.userFollowBaseURL}/v1/user/followees/niconico-users/${userId}.json`;
  }

  /**
   * ユーザーのフォロー状態を取得する
   * @param userId 対象ユーザーID
   * @returns フォロー中ならtrue
   */
  async fetchUserFollow(userId: string): Promise<boolean> {
    const res = await this.get(
      NicoliveClient.userFollowEndpoint(userId),
      {
        headers: {
          'Content-Type': 'application/json',
          'x-frontend-id': NicoliveClient.frontendID.toString(10),
        },
      },
    );
    if (res.ok) {
      const json = await res.json();
      console.info('fetchUserFollow', json);
      if (isValidUserFollowStatusResponse(json)) {
        return json.data.following;
      }
    }
    console.info('fetchUserFollow', userId, res); // DEBUG
    throw new Error(`fetchUserFollow failed: ${res.status} ${res.statusText}`);
  }


  private prepareUserFollowApi() {
    const session = remote.session;
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: [NicoliveClient.userFollowEndpoint('*')] },
      (details, callback) => {
        details.requestHeaders['Origin'] = null;
        callback({ cancel: false, requestHeaders: details.requestHeaders });
      },
    );
  }
  /**
   * ユーザーをフォローする
   * @param userId 対象ユーザーID
   */
  async followUser(userId: string): Promise<void> {
    this.prepareUserFollowApi();
    const res = await this.post(
      NicoliveClient.userFollowEndpoint(userId),
      {
        headers: {
          'Content-Type': 'application/json',
          'x-frontend-id': NicoliveClient.frontendID.toString(10),
          'X-Request-With': 'N Air',
        },
      },
    );
    if (!res.ok) {
      console.info('followUser', userId, res, await res.json()); // DEBUG
      throw new Error(`followUser failed: ${res.status} ${res.statusText}`);
    }
  }

  /**
   * ユーザーのフォローを解除する
   * @param userId 対象ユーザーID
   */
  async unFollowUser(userId: string): Promise<void> {
    this.prepareUserFollowApi();
    const res = await this.delete(
      NicoliveClient.userFollowEndpoint(userId),
      {
        headers: {
          'Content-Type': 'application/json',
          'x-frontend-id': NicoliveClient.frontendID.toString(10),
          'X-Request-With': 'N Air',
        },
      },
    );
    if (!res.ok) {
      console.info('unFollowUser', userId, res, await res.json());
      throw new Error(`unFollowUser failed: ${res.status} ${res.statusText}`);
    }
  }
}
