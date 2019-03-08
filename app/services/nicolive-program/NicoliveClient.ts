import { remote } from 'electron';
const {BrowserWindow} = remote;

export enum CreateResult {
  CREATED = 'CREATED',
  RESERVED = 'RESERVED',
  OTHER = 'OTHER',
}

export enum EditResult {
  EDITED = 'EDITED',
  OTHER = 'OTHER',
}

interface HeaderSeed { [key: string]: string }

export class NicoliveClient {
  static live2BaseURL = 'https://live2.nicovideo.jp';
  static publicBaseURL = 'https://public.api.nicovideo.jp';
  static nicoadBaseURL = 'https://api.nicoad.nicovideo.jp';
  private static frontendID = 134;

  static isProgramPage(url: string) {
    return /^https?:\/\/live2\.nicovideo\.jp\/watch\/lv\d+/.test(url);
  }

  static isMyPage(url: string) {
    const urlObj = new URL(url);
    return (
      /^https?:$/.test(urlObj.protocol) &&
      /^live2?\.nicovideo\.jp$/.test(urlObj.hostname) &&
      /^\/my$/.test(urlObj.pathname)
    );
  }

  static isAllowedURL(url: string) {
    return /^https?:\/\/live2?.nicovideo.jp\//.test(url);
  }

  private static createRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    requestInit: RequestInit
  ): RequestInit {
    return {
      method,
      mode: 'cors',
      credentials: 'include',
      ...requestInit,
    };
  }

  private get(url: string | URL, options: RequestInit = {}) {
    return fetch(url.toString(), NicoliveClient.createRequest('GET', options)).then(res => res.json());
  }

  private post(url: string | URL, options: RequestInit = {}) {
    return fetch(url.toString(), NicoliveClient.createRequest('POST', options)).then(res => res.json());
  }

  private put(url: string | URL, options: RequestInit = {}) {
    return fetch(url.toString(), NicoliveClient.createRequest('PUT', options)).then(res => res.json());
  }

  async fetchProgramSchedules(headers?: HeaderSeed) {
    return this.get(
      `${NicoliveClient.live2BaseURL}/unama/tool/v1/program_schedules`,
      { headers }
    );
  }

  async fetchProgram(programID: string, headers?: HeaderSeed) {
    return this.get(
      `${NicoliveClient.live2BaseURL}/watch/${programID}/programinfo`,
      { headers }
    );
  }

  async startProgram(programID: string, headers?: HeaderSeed) {
    return this.put(
      `${NicoliveClient.live2BaseURL}/watch/${programID}/segment`,
      { headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ state: 'on_air' }) }
    );
  }

  async endProgram(programID: string, headers?: HeaderSeed) {
    return this.put(
      `${NicoliveClient.live2BaseURL}/watch/${programID}/segment`,
      { headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ state: 'end' }) }
    );
  }

  async extendProgram(programID: string, minutes: number = 30, headers?: HeaderSeed) {
    return this.post(
      `${NicoliveClient.live2BaseURL}/watch/${programID}/extension`,
      { headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ minutes })}
    );
  }

  async sendOperatorComment(
    programID: string,
    { text, isPermanent }: { text: string, isPermanent?: boolean },
    headers?: HeaderSeed
  ) {
    return this.put(
      `${NicoliveClient.live2BaseURL}/watch/${programID}/operator_comment`,
      {
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ text, isPermanent }),
      }
    );
  }

  async fetchStatistics(programID: string, headers?: HeaderSeed) {
    return this.get(
      `${NicoliveClient.live2BaseURL}/watch/${programID}/statistics`,
      { headers }
    );
  }

  // 関心が別だが他の場所におく程の理由もないのでここにおく
  async fetchNicoadStatistics(programID: string, headers?: HeaderSeed) {
    return this.get(
      `${NicoliveClient.nicoadBaseURL}/v1/live/statusarea/${programID}`,
      { headers }
    );
  }

  // 関心が別だが他の場所におく程の理由もないのでここにおく
  async fetchCommunity(communityId: string, headers?: HeaderSeed) {
    const url = new URL(`${NicoliveClient.publicBaseURL}/v1/communities.json`);
    const params = {
      communityIds: communityId
    };
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    return this.get(
      url,
      {
        headers: {
          ...headers,
          'X-Frontend-Id': NicoliveClient.frontendID.toString(10)
        },
      })
  }

  // webview
  async createProgram() {
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
      win.loadURL('https://live2.nicovideo.jp/create');
    });
  }

  // webview
  async editProgram(programID: string) {
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
      win.loadURL(`https://live2.nicovideo.jp/edit/${programID}`);
    });
  }
}
