import { StatefulService, mutation } from './stateful-service';
import { NavigationService } from './navigation';
import { UserService } from './user';
import { Inject } from 'util/injector';
import electron from 'electron';
import crypto from 'crypto';
import base64 from 'base64-js';
import uuidv4 from 'uuid/v4';
import querystring from 'querystring';
import { $t } from './i18n';

type TQuestionaireStep =
  | 'Enquete';

type LicenseApiResponse = {
  meta: {
    status: number,
    state?: 'NEW-CREATE' | 'DATE-CONFIRMED' | 'KEY-MATCH',
    errorCode?: 'ENQUETE-REQUIRED' | 'INVALID-PARAM' | 'UNKNOWN_ERROR',
    errorMessage: string
  },
  data?: {
    serial?: string,
    url?: string
  }
};

interface IQuestionaireServiceState {
  currentStep: TQuestionaireStep;
  completedSteps: TQuestionaireStep[];
}

// Represents a single step in the questionaire flow.
// Implemented as a linked list.
interface IQuestionaireStep {
  // Whether this step should run.  The service is
  // passed in as an argument.
  isEligible: (service: QuestionaireService) => boolean;

  // The next step in the flow
  next?: TQuestionaireStep;
}

const QUESTIONAIRE_STEPS: Dictionary<IQuestionaireStep> = {
  Enquete: {
    isEligible: () => true
  }
};

export class QuestionaireService extends StatefulService<
  IQuestionaireServiceState
  > {
  static initialState: IQuestionaireServiceState = {
    currentStep: null,
    completedSteps: []
  };

  localStorageKey = 'InstallationUuidv4';
  private _uuid: string = null;

  @Inject() navigationService: NavigationService;
  @Inject() userService: UserService;

  init() {
    this._uuid = this.getUuid();
  }

  get uuid() {
    if (this._uuid === null) {
      this._uuid = this.getUuid();
    }
    return this._uuid;
  }

  @mutation()
  SET_CURRENT_STEP(step: TQuestionaireStep) {
    this.state.currentStep = step;
  }

  @mutation()
  RESET_COMPLETED_STEPS() {
    this.state.completedSteps = [];
  }

  @mutation()
  COMPLETE_STEP(step: TQuestionaireStep) {
    this.state.completedSteps.push(step);
  }

  get currentStep() {
    return this.state.currentStep;
  }

  get completedSteps() {
    return this.state.completedSteps;
  }

  // Completes the current step and moves on to the
  // next eligible step.
  next() {
    this.COMPLETE_STEP(this.state.currentStep);
    this.goToNextStep(QUESTIONAIRE_STEPS[this.state.currentStep].next);
  }

  // Skip the current step and move on to the next
  // eligible step.
  skip() {
    this.goToNextStep(QUESTIONAIRE_STEPS[this.state.currentStep].next);
  }

  start() {
    this.RESET_COMPLETED_STEPS();
    this.SET_CURRENT_STEP('Enquete');
    this.navigationService.navigate('Questionaire');
  }

  // Ends the questionaire process
  finish() {
    this.navigationService.navigate('Studio');
  }

  private goToNextStep(step: TQuestionaireStep) {
    if (!step) {
      this.finish();
      return;
    }

    const stepObj = QUESTIONAIRE_STEPS[step];

    if (stepObj.isEligible(this)) {
      this.SET_CURRENT_STEP(step);
    } else {
      this.goToNextStep(stepObj.next);
    }
  }

  private makeHash(options: { uuid: string, key: string }): string {
    const { uuid, key } = options;
    const keyArray = base64.toByteArray(key);
    const binaryKey = Buffer.from(keyArray.buffer as ArrayBuffer);
    const hmac = crypto.createHmac('sha256', binaryKey);
    hmac.update(uuid);
    const hash = hmac.digest('hex');
    return hash;
  }

  callLicenseApi(options: { uuid: string, hash: string }): Promise<LicenseApiResponse> {
    const { uuid, hash } = options;
    const query = querystring.stringify({ c: hash, uuid });
    const requestUrl = `http://live.nicovideo.jp/encoder/getlicensenair?${query}`;
    console.log(requestUrl);

    const headers = new Headers();
    const request = new Request(requestUrl, { headers, credentials: 'include' });
    return fetch(request)
      .then(response => response.json());
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

  /**
   * Parses tokens out of the euqnete URL
   */
  private checkIfEnqueteCompleted(url: string): boolean {
    if (
      url.match(/postreview/)
    ) {
      return true;
    }

    return false;
  }
  private showEnqueteWindow(url: string) {
    let answered = false;
    const enqueteWindow = new electron.remote.BrowserWindow({
      alwaysOnTop: false,
      show: true,
      width: 740 * 1.5,
      webPreferences: {
        nodeIntegration: false,
        nativeWindowOpen: true,
        sandbox: true
      }
    });

    electron.ipcRenderer.send('window-preventClose', enqueteWindow.id);
    function setAnswered() {
      if (!answered) {
        electron.ipcRenderer.send('window-allowClose', enqueteWindow.id);
        answered = true;
      }
    }

    enqueteWindow.webContents.on('did-navigate', (e, url) => {
      console.log('did-navigate', url);
      if (this.checkIfEnqueteCompleted(url)) {
        console.log('answered!');
        setAnswered();
        enqueteWindow.close();
        this.finish();
      }
    });

    enqueteWindow.on('close', (e) => {
      // 完了以外で閉じたらアプリ終了
      if (!answered) {
        electron.remote.dialog.showMessageBox(
          electron.remote.getCurrentWindow(), // enqueteWindowにするとダイアログ自体出ない
          {
            type: 'warning',
            buttons: [$t('common.cancel'), $t('common.ok')],
            title: $t('onboarding.questionaireSkipWarningTitle'),
            message: $t('onboarding.questionaireSkipWarning'),
            noLink: true,
          },
          ok => {
            if (!ok) {
              enqueteWindow.focus();
              return;
            }
            setAnswered();
            electron.remote.app.quit();
          }
        );
      }
    });

    enqueteWindow.setMenu(null);
    enqueteWindow.loadURL(url);
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

      // まずアンケートを出す必要があるかどうか判定する
      return this.callLicenseApi({ uuid, hash }).then((result: LicenseApiResponse) => {
        console.log('getlicenseair response: ', result);
        switch (result.meta.status) {
          case 403:
            if (result.meta.errorCode === 'ENQUETE-REQUIRED') {
              this.start();
              // APIがアンケートを必要と返してきたらアンケートを表示する
              this.showEnqueteWindow(result.data.url);
              return true;
            }
        }
        if (result.meta.status != 200) {
          throw new Error('getlicenseair error: '
            + `status(${result.meta.status})`
            + `, errorCode(${result.meta.errorCode}`
            + `, errorMessage(${result.meta.errorMessage})`);
        }
        return false;
      }).catch(() => false);
    });
  }
}