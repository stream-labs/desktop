import { StatefulService } from './core/stateful-service';
import crypto from 'crypto';
import base64 from 'base64-js';
import uuidv4 from 'uuid/v4';
import querystring from 'querystring';

type LicenseApiResponse = {
  meta: {
    status: number;
    state?: 'NEW-CREATE' | 'DATE-CONFIRMED' | 'KEY-MATCH';
    errorCode?: 'ENQUETE-REQUIRED' | 'INVALID-PARAM' | 'UNKNOWN_ERROR';
    errorMessage: string;
  };
  data?: {
    serial?: string;
    url?: string;
  };
};

interface IQuestionaireServiceState {}

export class QuestionaireService extends StatefulService<IQuestionaireServiceState> {
  localStorageKey = 'InstallationUuidv4';
  private _uuid: string = null;

  init() {
    this._uuid = this.getUuid();
  }

  get uuid() {
    if (this._uuid === null) {
      this._uuid = this.getUuid();
    }
    return this._uuid;
  }

  private makeHash(options: { uuid: string; key: string }): string {
    const { uuid, key } = options;
    const keyArray = base64.toByteArray(key);
    const binaryKey = Buffer.from(keyArray.buffer as ArrayBuffer);
    const hmac = crypto.createHmac('sha256', binaryKey);
    hmac.update(uuid);
    const hash = hmac.digest('hex');
    return hash;
  }

  callLicenseApi(options: { uuid: string; hash: string }): Promise<LicenseApiResponse> {
    const { uuid, hash } = options;
    const query = querystring.stringify({ c: hash, uuid });
    const requestUrl = `http://live.nicovideo.jp/encoder/getlicensenair?${query}`;
    console.log(requestUrl);

    const headers = new Headers();
    const request = new Request(requestUrl, { headers, credentials: 'include' });
    return fetch(request).then(response => response.json());
  }

  private generateUuid(): string {
    return uuidv4();
  }

  private getUuid(): string {
    // もし uuid が生成済みで保存されていたらそれを返す
    const storageUuid = localStorage.getItem(this.localStorageKey);
    if (storageUuid !== null) {
      return storageUuid;
    }
    // 無ければ生成して保存してから返す
    const uuid = this.generateUuid();
    localStorage.setItem(this.localStorageKey, uuid);
    return uuid;
  }

  private apiKey(): Promise<string> {
    if (process.env.NAIR_LICENSE_API_KEY) {
      return Promise.resolve(process.env.NAIR_LICENSE_API_KEY);
    }
    console.warn('WARNING: getlicensenair API key not found');
    return Promise.resolve('');
  }

  // @retval true: started questionaire
  startIfRequired(): Promise<boolean> {
    return this.apiKey().then(key => {
      if (!key) {
        return false;
      }

      const uuid = this.uuid;
      const hash = this.makeHash({ uuid, key });
      console.log('uuid = ', uuid);
      console.log('hash = ', hash);

      // 以前はアンケートを出す判断をする目的で呼び出していたAPIだが、アンケートはなくなったため、
      // 現在はインストール数を集計する目的で利用している
      return this.callLicenseApi({ uuid, hash })
        .then((result: LicenseApiResponse) => {
          console.log('getlicenseair response: ', result);
          if (result.meta.status !== 200) {
            throw new Error(
              'getlicenseair error: ' +
                `status(${result.meta.status})` +
                `, errorCode(${result.meta.errorCode}` +
                `, errorMessage(${result.meta.errorMessage})`,
            );
          }
          return false;
        })
        .catch(() => false);
    });
  }
}
