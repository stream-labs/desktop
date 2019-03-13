import { remote, ipcRenderer } from 'electron';
import {
  ProgramSchedules,
  ProgramInfo,
  Segment,
  Extension,
  OperatorComment,
  Statistics,
  NicoadStatistics,
  Communities,
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
    return /^https?:\/\/live2?.nicovideo.jp\//.test(url);
  }

  private static createRequest(method: 'GET' | 'POST' | 'PUT' | 'DELETE', requestInit: RequestInit): RequestInit {
    return {
      method,
      mode: 'cors',
      credentials: 'include',
      ...requestInit,
    };
  }

  private async get(url: string | URL, options: RequestInit = {}) {
    const res = await fetch(url.toString(), NicoliveClient.createRequest('GET', options));
    return res.json();
  }

  private async post(url: string | URL, options: RequestInit = {}) {
    const res = await fetch(url.toString(), NicoliveClient.createRequest('POST', options));
    return res.json();
  }

  private async put(url: string | URL, options: RequestInit = {}) {
    const res = await fetch(url.toString(), NicoliveClient.createRequest('PUT', options));
    return res.json();
  }

  /** ユーザごとの番組スケジュールを取得 */
  async fetchProgramSchedules(headers?: HeaderSeed): Promise<ProgramSchedules> {
    return this.get(`${NicoliveClient.live2BaseURL}/unama/tool/v1/program_schedules`, { headers });
  }

  /** 番組情報を取得 */
  async fetchProgram(programID: string, headers?: HeaderSeed): Promise<ProgramInfo> {
    return this.get(`${NicoliveClient.live2BaseURL}/watch/${programID}/programinfo`, { headers });
  }

  /** 番組を開始 */
  async startProgram(programID: string, headers?: HeaderSeed): Promise<Segment> {
    return this.put(`${NicoliveClient.live2BaseURL}/watch/${programID}/segment`, {
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ state: 'on_air' }),
    });
  }

  /** 番組を終了 */
  async endProgram(programID: string, headers?: HeaderSeed): Promise<Segment> {
    return this.put(`${NicoliveClient.live2BaseURL}/watch/${programID}/segment`, {
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ state: 'end' }),
    });
  }

  /** 番組を延長 */
  async extendProgram(programID: string, minutes: number = 30, headers?: HeaderSeed): Promise<Extension> {
    return this.post(`${NicoliveClient.live2BaseURL}/watch/${programID}/extension`, {
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ minutes }),
    });
  }

  /** 運営コメントを送信 */
  async sendOperatorComment(
    programID: string,
    { text, isPermanent }: { text: string; isPermanent?: boolean },
    headers?: HeaderSeed
  ): Promise<OperatorComment> {
    return this.put(`${NicoliveClient.live2BaseURL}/watch/${programID}/operator_comment`, {
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ text, isPermanent }),
    });
  }

  /** 統計情報（視聴者とコメント数）を取得 */
  async fetchStatistics(programID: string, headers?: HeaderSeed): Promise<Statistics> {
    return this.get(`${NicoliveClient.live2BaseURL}/watch/${programID}/statistics`, { headers });
  }

  // 関心が別だが他の場所におく程の理由もないのでここにおく
  /**
   * ニコニ広告ptとギフトptを取得
   * 放送開始前は404になる
   **/
  async fetchNicoadStatistics(programID: string, headers?: HeaderSeed): Promise<NicoadStatistics> {
    return this.get(`${NicoliveClient.nicoadBaseURL}/v1/live/statusarea/${programID}`, { headers });
  }

  // 関心が別だが他の場所におく程の理由もないのでここにおく
  /** コミュニティ情報を取得 */
  async fetchCommunity(communityId: string, headers?: HeaderSeed): Promise<Communities> {
    const url = new URL(`${NicoliveClient.publicBaseURL}/v1/communities.json`);
    const params = {
      communityIds: communityId,
    };
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    return this.get(url, {
      headers: {
        ...headers,
        'X-Frontend-Id': NicoliveClient.frontendID.toString(10),
      },
    });
  }

  /** 番組作成画面を開いて結果を返す */
  async createProgram(): Promise<CreateResult> {
    const win = new BrowserWindow({ width: 1200, height: 900 });
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
    const win = new BrowserWindow({ width: 1200, height: 900 });
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
