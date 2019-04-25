import { remote, ipcRenderer } from 'electron';
import {
  ProgramSchedules,
  ProgramInfo,
  Segment,
  Extension,
  Statistics,
  NicoadStatistics,
  Communities,
  CommonErrorResponse,
  Community,
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
type WrappedResult<T> =
  | SucceededResult<T>
  | FailedResult;

export function isOk<T>(result: WrappedResult<T>): result is SucceededResult<T> {
  return result.ok === true;
}

export class NicoliveClient {
  static live2BaseURL = 'https://live2.nicovideo.jp';
  static publicBaseURL = 'https://public.api.nicovideo.jp';
  static nicoadBaseURL = 'https://api.nicoad.nicovideo.jp';
  private static frontendID = 134;

  static isProgramPage(url: string): boolean {
    return /^https?:\/\/live2\.nicovideo\.jp\/watch\/lv\d+/.test(url);
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
    // メンテ中は作成画面に http://blog.nicovideo.jp/niconews/category/nicolivemainte/ へのリンクが表示されるので表示を許す
    return (
      /^https?:\/\/live2?.nicovideo.jp\//.test(url) ||
      /^https?:\/\/blog\.nicovideo\.jp\/niconews\//.test(url)
    );
  }

  private static createRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', requestInit: RequestInit): RequestInit {
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
    } catch(e) {
      // bodyがJSONになってない異常失敗
      throw {
        status: res.status,
        statusText: res.statusText,
        body,
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

  private get(url: string | URL, options: RequestInit = {}): Promise<Response> {
    return fetch(url.toString(), NicoliveClient.createRequest('GET', options));
  }

  private post(url: string | URL, options: RequestInit = {}): Promise<Response> {
    return fetch(url.toString(), NicoliveClient.createRequest('POST', options));
  }

  private put(url: string | URL, options: RequestInit = {}): Promise<Response> {
    return fetch(url.toString(), NicoliveClient.createRequest('PUT', options));
  }

  /** ユーザごとの番組スケジュールを取得 */
  async fetchProgramSchedules(headers?: HeaderSeed): Promise<WrappedResult<ProgramSchedules['data']>> {
    try {
      const res = await this.get(`${NicoliveClient.live2BaseURL}/unama/tool/v1/program_schedules`, { headers });
      return NicoliveClient.wrapResult<ProgramSchedules['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err);
    }
  }

  /** 番組情報を取得 */
  async fetchProgram(programID: string, headers?: HeaderSeed): Promise<WrappedResult<ProgramInfo['data']>> {
    try {
      const res = await this.get(`${NicoliveClient.live2BaseURL}/watch/${programID}/programinfo`, { headers });
      return NicoliveClient.wrapResult<ProgramInfo['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err);
    }
  }

  /** 番組を開始 */
  async startProgram(programID: string, headers?: HeaderSeed): Promise<WrappedResult<Segment['data']>> {
    try {
      const res = await this.put(`${NicoliveClient.live2BaseURL}/watch/${programID}/segment`, {
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'on_air' }),
      });

      return NicoliveClient.wrapResult<Segment['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err);
    }
  }

  /** 番組を終了 */
  async endProgram(programID: string, headers?: HeaderSeed): Promise<WrappedResult<Segment['data']>> {
    try {
      const res = await this.put(`${NicoliveClient.live2BaseURL}/watch/${programID}/segment`, {
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'end' }),
      });

      return NicoliveClient.wrapResult<Segment['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err);
    }
  }

  /** 番組を延長 */
  async extendProgram(
    programID: string,
    minutes: number = 30,
    headers?: HeaderSeed
  ): Promise<WrappedResult<Extension['data']>> {
    try {
      const res = await this.post(`${NicoliveClient.live2BaseURL}/watch/${programID}/extension`, {
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes }),
      });

      return NicoliveClient.wrapResult<Extension['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err);
    }
  }

  /** 運営コメントを送信 */
  async sendOperatorComment(
    programID: string,
    { text, isPermanent }: { text: string; isPermanent?: boolean },
    headers?: HeaderSeed
  ): Promise<WrappedResult<void>> {
    try {
      const res = await this.put(`${NicoliveClient.live2BaseURL}/watch/${programID}/operator_comment`, {
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, isPermanent }),
      });

      return NicoliveClient.wrapResult<void>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err);
    }
  }

  /** 統計情報（視聴者とコメント数）を取得 */
  async fetchStatistics(programID: string, headers?: HeaderSeed): Promise<WrappedResult<Statistics['data']>> {
    try {
      const res = await this.get(`${NicoliveClient.live2BaseURL}/watch/${programID}/statistics`, { headers });

      return NicoliveClient.wrapResult<Statistics['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err);
    }
  }

  // 関心が別だが他の場所におく程の理由もないのでここにおく
  /**
   * ニコニ広告ptとギフトptを取得
   * 放送開始前は404になる
   **/
  async fetchNicoadStatistics(
    programID: string,
    headers?: HeaderSeed
  ): Promise<WrappedResult<NicoadStatistics['data']>> {
    try {
      const res = await this.get(`${NicoliveClient.nicoadBaseURL}/v1/live/statusarea/${programID}`, { headers });

      return NicoliveClient.wrapResult<NicoadStatistics['data']>(res);
    } catch (err) {
      return NicoliveClient.wrapFetchError(err);
    }
  }

  // 関心が別だが他の場所におく程の理由もないのでここにおく
  /** コミュニティ情報を取得 */
  async fetchCommunity(communityId: string, headers?: HeaderSeed): Promise<WrappedResult<Community>> {
    const url = new URL(`${NicoliveClient.publicBaseURL}/v1/communities.json`);
    const params = {
      communityIds: communityId,
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
      return NicoliveClient.wrapFetchError(err);
    }

    const body = await res.text()
    let obj: any = null;
    try {
      obj = JSON.parse(body);
    } catch (e) {
      // bodyがJSONになってない異常失敗
      return {
        ok: false,
        value: e,
      };
    }

    if (res.ok) {
      const data = obj.data as Communities['data'];
      const communities = data.communities || [];
      const errors = data.errors || [];

      const community = communities.find(c => c.id === communityId);
      if (community) {
        // 正常成功
        return {
          ok: true,
          value: community,
        };
      }

      const error = errors.find(e => e.id === communityId);
      if (error) {
        // 正常失敗
        return {
          ok: false,
          value: errors[0] as CommonErrorResponse,
        };
      }
    }

    // 正常失敗
    return {
      ok: false,
      value: obj as CommonErrorResponse,
    };
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
    return new Promise<CreateResult>((resolve, _reject) => {
      win.on('closed', () => resolve(CreateResult.OTHER));
      win.webContents.on('did-navigate', (_event, url) => {
        if (NicoliveClient.isProgramPage(url)) {
          resolve(CreateResult.CREATED);
          win.close();
        } else if (NicoliveClient.isMyPage(url)) {
          resolve(CreateResult.RESERVED);
          win.close();
        } else if (!NicoliveClient.isAllowedURL(url)) {
          resolve(CreateResult.OTHER);
          win.close();
        }
      });
      ipcRenderer.send('window-preventLogout', win.id);
      ipcRenderer.send('window-preventNewWindow', win.id);
      win.loadURL('https://live2.nicovideo.jp/create');
    });
  }

  /** 番組編集画面を開いて結果を返す */
  async editProgram(programID: string): Promise<EditResult> {
    const win = new BrowserWindow({
      width: 1200,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        nodeIntegrationInWorker: false,
        nativeWindowOpen: true,
      },
    });
    return new Promise<EditResult>((resolve, _reject) => {
      win.on('closed', () => resolve(EditResult.OTHER));
      win.webContents.on('did-navigate', (_event, url) => {
        if (NicoliveClient.isProgramPage(url) || NicoliveClient.isMyPage(url)) {
          resolve(EditResult.EDITED);
          win.close();
        } else if (!NicoliveClient.isAllowedURL(url)) {
          resolve(EditResult.OTHER);
          win.close();
        }
      });
      ipcRenderer.send('window-preventLogout', win.id);
      ipcRenderer.send('window-preventNewWindow', win.id);
      win.loadURL(`https://live2.nicovideo.jp/edit/${programID}`);
    });
  }
}
