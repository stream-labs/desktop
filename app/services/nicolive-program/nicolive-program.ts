import { StatefulService, mutation } from 'services/stateful-service';
import { NicoliveClient, CreateResult, EditResult, isOk, FailedResult } from './NicoliveClient';
import { ProgramSchedules } from './ResponseTypes';
import { Inject } from 'util/injector';
import { NicoliveProgramStateService } from './state';
import { WindowsService } from 'services/windows';
import { UserService } from 'services/user';
import { BrowserWindow, remote } from 'electron';
import { $t } from 'services/i18n';

type Schedules = ProgramSchedules['data'];
type Schedule = Schedules[0];

type ProgramState = {
  programID: string;
  status: 'reserved' | 'test' | 'onAir' | 'end';
  title: string;
  description: string;
  endTime: number;
  startTime: number;
  isMemberOnly: boolean;
  communityID: string;
  communityName: string;
  communitySymbol: string;
  viewers: number;
  comments: number;
  adPoint: number;
  giftPoint: number;
}

interface INicoliveProgramState extends ProgramState {
  /**
   * 永続化された状態をコンポーネントに伝えるための一時置き場
   * 直接ここを編集してはいけない、stateService等の操作結果を反映するだけにする
   */
  autoExtensionEnabled: boolean;
  panelOpened: boolean | null; // 初期化前はnull、永続化された値の読み出し後に値が入る
  isLoggedIn: boolean | null; // 初期化前はnull、永続化された値の読み出し後に値が入る
}

export enum PanelState {
  INACTIVE = 'INACTIVE',
  OPENED = 'OPENED',
  CLOSED = 'CLOSED',
}

export class NicoliveProgramServiceFailure {
  constructor(
    public type: 'logic' | 'http_error' | 'network_error',
    public method: string,
    public reason: string
  ) {}

  static fromClientError(method: string, res: FailedResult) {
    if (res.value instanceof Error) {
      console.error(res.value);
      return new this('network_error', method, 'network_error');
    }
    return new this('http_error', method, res.value.meta.status.toString(10));
  }

  static fromConditionalError(method: string, reason: string) {
    return new this('logic', method, reason);
  }
}

export class NicoliveProgramService extends StatefulService<INicoliveProgramState> {
  @Inject('NicoliveProgramStateService') stateService: NicoliveProgramStateService;
  @Inject()
  windowsService: WindowsService;
  @Inject()
  userService: UserService;

  client: NicoliveClient = new NicoliveClient();

  static programInitialState: ProgramState = {
    programID: '',
    status: 'end',
    title: '',
    description: '',
    endTime: NaN,
    startTime: NaN,
    isMemberOnly: false,
    communityID: '',
    communityName: '',
    communitySymbol: '',
    viewers: 0,
    comments: 0,
    adPoint: 0,
    giftPoint: 0,
  };

  static initialState: INicoliveProgramState = {
    ...NicoliveProgramService.programInitialState,
    autoExtensionEnabled: false,
    panelOpened: null,
    isLoggedIn: null,
  };

  init(): void {
    super.init();

    this.stateService.updated.subscribe({
      next: persistentState => {
        this.setState(persistentState);
      }
    });

    this.userService.userLoginState.subscribe({
      next: user => {
        this.setState({ isLoggedIn: Boolean(user) });
        if (!user) {
          this.setState(NicoliveProgramService.programInitialState);
        }
      }
    });

    // UserServiceのSubjectをBehaviorに変更するのは影響が広すぎる
    this.setState({ isLoggedIn: this.userService.isLoggedIn() });
  }

  private setState(partialState: Partial<INicoliveProgramState>) {
    const nextState = { ...this.state, ...partialState };
    this.refreshStatisticsPolling(this.state, nextState);
    this.refreshProgramStatusTimer(this.state, nextState);
    this.refreshAutoExtensionTimer(this.state, nextState);
    this.refreshWindowSize(this.state, nextState);
    this.SET_STATE(nextState);
  }

  @mutation()
  private SET_STATE(nextState: INicoliveProgramState): void {
    this.state = nextState;
  }

  static async openErrorDialog({ title, message }: { title: string, message: string }): Promise<void> {
    return new Promise<void>(resolve => {
      remote.dialog.showMessageBox(
        remote.getCurrentWindow(),
        {
          type: 'warning',
          title,
          message,
          buttons: [$t('common.close')],
          noLink: true,
        },
        _ => resolve()
      );
    });
  }

  static async openErrorDialogFromFailure(failure: NicoliveProgramServiceFailure): Promise<void> {
    if (failure.type === 'logic') {
      return this.openErrorDialog({
        title: $t(`nicolive-program.errors.logic.${failure.method}.${failure.reason}.title`),
        message: $t(`nicolive-program.errors.logic.${failure.method}.${failure.reason}.message`)
      });
    }

    return this.openErrorDialog({
      title: $t(`nicolive-program.errors.api.${failure.method}.${failure.reason}.title`),
      message: $t(`nicolive-program.errors.api.${failure.method}.${failure.reason}.message`)
    });
  }

  /**
   * 番組スケジュールから表示すべき番組を選ぶ
   * 1. テスト中または放送中の番組があればその番組を返す
   * 2. 予約番組があるなら最も近い予約番組を返す
   */
  static findSuitableProgram(schedules: Schedules): null | Schedule {
    // テスト中・放送中の番組があればそれで確定
    const currentProgram = schedules.find(
      s => s.socialGroupId.startsWith('co') && (s.status === 'test' || s.status === 'onAir')
    );
    if (currentProgram) return currentProgram;

    let nearestReservedProgram: null | Schedule = null;
    for (const s of schedules) {
      // ユーザー生放送以外は無視
      if (!s.socialGroupId.startsWith('co')) continue;
      if (s.status === 'end') continue;

      // 一番近い予約放送を選ぶ
      if (!nearestReservedProgram || s.onAirBeginAt < nearestReservedProgram.onAirBeginAt) {
        nearestReservedProgram = s;
      }
    }
    return nearestReservedProgram;
  }

  static isProgramExtendable(state: INicoliveProgramState): boolean {
    return state.status === 'onAir' && state.endTime - state.startTime < 6 * 60 * 60;
  }

  static format(timeInSeconds: number): string {
    if (Number.isNaN(timeInSeconds)) return '--:--:--';
    const absTime = Math.abs(timeInSeconds);
    const s = absTime % 60;
    const m = Math.floor(absTime / 60) % 60;
    const h = Math.floor(absTime / 3600);
    const sign = Math.sign(timeInSeconds) > 0 ? '' : '-';
    const ss = s.toString(10).padStart(2, '0');
    const mm = m.toString(10).padStart(2, '0');
    const hh = h.toString(10).padStart(2, '0');
    return `${sign}${hh}:${mm}:${ss}`;
  }

  get hasProgram(): boolean {
    return Boolean(this.state.programID);
  }

  get isProgramExtendable(): boolean {
    return NicoliveProgramService.isProgramExtendable(this.state);
  }

  async createProgram(): Promise<CreateResult> {
    const result = await this.client.createProgram();
    if (result === 'CREATED') {
      await this.fetchProgram();
    }
    return result;
  }

  async fetchProgram(): Promise<void> {
    const schedulesResponse = await this.client.fetchProgramSchedules();
    if (!isOk(schedulesResponse)) {
      throw NicoliveProgramServiceFailure.fromClientError('fetchProgramSchedules', schedulesResponse);
    }

    const programSchedule = NicoliveProgramService.findSuitableProgram(schedulesResponse.value);

    if (!programSchedule) {
      this.setState({ status: 'end' });
      throw NicoliveProgramServiceFailure.fromConditionalError('fetchProgram', 'no_suitable_program');
    }
    const { nicoliveProgramId, socialGroupId } = programSchedule;

    const [programResponse, communityResponse] = await Promise.all([
      this.client.fetchProgram(nicoliveProgramId),
      this.client.fetchCommunity(socialGroupId),
    ]);
    if (!isOk(programResponse)) {
      throw NicoliveProgramServiceFailure.fromClientError('fetchProgram', programResponse);
    }
    if (!isOk(communityResponse)) {
      // コミュニティ情報が取れなくても配信はできてよいはず
      if (communityResponse.value instanceof Error) {
        console.error('fetchCommunity', communityResponse.value);
      } else {
        console.error(
          'fetchCommunity',
          communityResponse.value.meta.status,
          communityResponse.value.meta.errorMessage || ''
        );
      }
    }

    const community = isOk(communityResponse) && communityResponse.value;
    const program = programResponse.value;

    this.setState({
      programID: nicoliveProgramId,
      status: program.status,
      title: program.title,
      description: program.description,
      startTime: program.beginAt,
      endTime: program.endAt,
      isMemberOnly: program.isMemberOnly,
      communityID: socialGroupId,
      communityName: community ? community.name : '(コミュニティの取得に失敗しました)',
      communitySymbol: community ? community.thumbnailUrl.small : '',
    });
  }

  async refreshProgram(): Promise<void> {
    const programResponse = await this.client.fetchProgram(this.state.programID);
    if (!isOk(programResponse)) {
      throw NicoliveProgramServiceFailure.fromClientError('fetchProgram', programResponse);
    }

    const program = programResponse.value;

    this.setState({
      status: program.status,
      title: program.title,
      description: program.description,
      startTime: program.beginAt,
      endTime: program.endAt,
      isMemberOnly: program.isMemberOnly,
    });
  }

  async editProgram(): Promise<EditResult> {
    const result = await this.client.editProgram(this.state.programID);
    if (result === 'EDITED') {
      await this.refreshProgram();
    }
    return result;
  }

  async startProgram(): Promise<void> {
    const result = await this.client.startProgram(this.state.programID);
    if (!isOk(result)) {
      throw NicoliveProgramServiceFailure.fromClientError('startProgram', result);
    }

    const endTime = result.value.end_time;
    const startTime = result.value.start_time;
    this.setState({ status: 'onAir', endTime, startTime });
  }

  async endProgram(): Promise<void> {
    const result = await this.client.endProgram(this.state.programID);
    if (!isOk(result)) {
      throw NicoliveProgramServiceFailure.fromClientError('endProgram', result);
    }

    const endTime = result.value.end_time;
    this.setState({ status: 'end', endTime });
  }

  toggleAutoExtension(): void {
    this.stateService.toggleAutoExtension();
  }

  async extendProgram(): Promise<void> {
    const result = await this.client.extendProgram(this.state.programID);
    if (!isOk(result)) {
      throw NicoliveProgramServiceFailure.fromClientError('extendProgram', result);
    }

    const endTime = result.value.end_time;
    this.setState({ endTime });
  }

  private statsTimer: number = 0;
  refreshStatisticsPolling(prevState: INicoliveProgramState, nextState: INicoliveProgramState): void {
    const programUpdated = prevState.programID !== nextState.programID;

    const prev = prevState.status === 'onAir';
    const next = nextState.status === 'onAir';

    if ((!prev && next) || (next && programUpdated)) {
      clearInterval(this.statsTimer);
      this.updateStatistics(nextState.programID); // run and forget
      this.statsTimer = window.setInterval((id: string) => this.updateStatistics(id), 60 * 1000, nextState.programID);
    } else if (prev && !next) {
      clearInterval(this.statsTimer);
    }
  }

  updateStatistics(programID: string): Promise<any> {
    const stats = this.client
      .fetchStatistics(programID)
      .then(res => {
        if (isOk(res)) {
          this.setState({
            viewers: res.value.watchCount,
            comments: res.value.commentCount,
          });
        }
      })
      .catch(() => null);
    const adStats = this.client
      .fetchNicoadStatistics(programID)
      .then(res => {
        if (isOk(res)) {
          this.setState({
            adPoint: res.value.totalAdPoint,
            giftPoint: res.value.totalGiftPoint,
          });
        }
      })
      .catch(() => null);

    // return for testing
    return Promise.all([stats, adStats]);
  }

  async sendOperatorComment(text: string, isPermanent: boolean): Promise<void> {
    const result = await this.client.sendOperatorComment(this.state.programID, { text, isPermanent });
    if (!isOk(result)) {
      throw NicoliveProgramServiceFailure.fromClientError('sendOperatorComment', result);
    }
  }

  static TIMER_PADDING_SECONDS = 3;
  static REFRESH_TARGET_TIME_TABLE = {
    reserved: 'startTime',
    test: 'startTime',
    onAir: 'endTime',
  };
  private refreshProgramTimer = 0;
  refreshProgramStatusTimer(prevState: INicoliveProgramState, nextState: INicoliveProgramState): void {
    const programUpdated = prevState.programID !== nextState.programID;
    const statusUpdated = prevState.status !== nextState.status;

    /** 放送状態が変化しなかった前提で、放送状態が次に変化するであろう時刻 */
    const prevTargetTime: number = prevState[NicoliveProgramService.REFRESH_TARGET_TIME_TABLE[nextState.status]];
    const nextTargetTime: number = nextState[NicoliveProgramService.REFRESH_TARGET_TIME_TABLE[nextState.status]];
    const targetTimeUpdated = !statusUpdated && prevTargetTime !== nextTargetTime;

    const prev = prevState.status !== 'end';
    const next = nextState.status !== 'end';

    if (next && (!prev || programUpdated || statusUpdated || targetTimeUpdated)) {
      const now = Date.now();

      // 次に放送状態が変化する予定の時刻（より少し後）に放送情報を更新するタイマーを仕込む
      clearTimeout(this.refreshProgramTimer);
      this.refreshProgramTimer = window.setTimeout(() => {
        this.refreshProgram();
      }, (nextTargetTime + NicoliveProgramService.TIMER_PADDING_SECONDS) * 1000 - now);
    } else if (prev && !next) {
      clearTimeout(this.refreshProgramTimer);
    }
  }

  private autoExtensionTimer = 0;
  refreshAutoExtensionTimer(prevState: INicoliveProgramState, nextState: INicoliveProgramState): void {
    const now = Date.now();
    const endTimeUpdated = prevState.endTime !== nextState.endTime;

    /** 更新前の状態でタイマーが動作しているべきか */
    const prev = prevState.autoExtensionEnabled && NicoliveProgramService.isProgramExtendable(prevState);
    /** 更新後の状態でタイマーが動作しているべきか */
    const next = nextState.autoExtensionEnabled && NicoliveProgramService.isProgramExtendable(nextState);

    // 動作すべき状態になる OR 終了時刻が変わったら再設定
    if ((next && !prev) || (next && endTimeUpdated)) {
      clearTimeout(this.autoExtensionTimer);
      const timeout = (nextState.endTime - 5 * 60) * 1000 - now;
      // 5分前をすでに過ぎていたら即延長
      if (timeout <= 0) {
        this.extendProgram();
      } else {
        this.autoExtensionTimer = window.setTimeout(() => {
          this.extendProgram();
        }, timeout);
        console.log(
          '自動延長タイマーが（再）設定されました ',
          Math.floor(((nextState.endTime - 5 * 60) * 1000 - now) / 1000),
          '秒後に自動延長します'
        );
      }
      return;
    }

    // 動作すべきでない状態になるなら解除
    if (prev && !next) {
      clearTimeout(this.autoExtensionTimer);
      console.log('自動延長タイマーが解除されました');
    }
  }

  togglePanelOpened(): void {
    this.stateService.togglePanelOpened();
  }

  static getPanelState(panelOpened: boolean, isLoggedIn: boolean): PanelState | null {
    if (panelOpened === null || isLoggedIn === null) return null;
    if (!isLoggedIn) return PanelState.INACTIVE;
    return panelOpened ? PanelState.OPENED : PanelState.CLOSED;
  }

  /** パネルが出る幅の分だけ画面の最小幅を拡張する */
  refreshWindowSize(prevState: INicoliveProgramState, nextState: INicoliveProgramState): void {
    if (prevState.panelOpened === nextState.panelOpened && prevState.isLoggedIn === nextState.isLoggedIn) return;

    const prevPanelState = NicoliveProgramService.getPanelState(prevState.panelOpened, prevState.isLoggedIn);
    const nextPanelState = NicoliveProgramService.getPanelState(nextState.panelOpened, nextState.isLoggedIn);
    if (prevPanelState !== nextPanelState) {
      NicoliveProgramService.updateWindowSize(this.windowsService.getWindow('main'), prevPanelState, nextPanelState);
    }
  }

  static WINDOW_MIN_WIDTH: { [key in PanelState]: number } = {
    INACTIVE: 800, // 通常値
    OPENED: 800 + 400 + 24, // +パネル幅+開閉ボタン幅
    CLOSED: 800 + 24, // +開閉ボタン幅
  };

  /*
   * NOTE: 似た処理を他所にも書きたくなったらウィンドウ幅を管理する存在を置くべきで、コピペは悪いことを言わないのでやめておけ
   * このコメントを書いている時点でメインウィンドウのウィンドウ幅を操作する存在は他にいない
   */
  static updateWindowSize(win: BrowserWindow, prevState: PanelState, nextState: PanelState): void {
    if (nextState === null) throw new Error('nextState is null');
    const onInit = !prevState;

    const [, minHeight] = win.getMinimumSize();
    const [width, height] = win.getSize();
    const nextMinWidth = NicoliveProgramService.WINDOW_MIN_WIDTH[nextState];
    win.setMinimumSize(nextMinWidth, minHeight);

    // 復元されたウィンドウ幅が復元されたパネル状態の最小幅を満たさない場合、最小幅まで広げる
    if (onInit && width < nextMinWidth) {
      win.setSize(nextMinWidth, height);
    }

    // ウィンドウ幅とログイン状態・パネル開閉状態の永続化が別管理なので、初期化が終わって情報が揃ってから更新する
    // 最大化されているときはウィンドウサイズを操作しない（画面外に飛び出したりして不自然なことになる）
    if (!onInit && !win.isMaximized()) {
      const prevMinWidth = NicoliveProgramService.WINDOW_MIN_WIDTH[prevState];
      win.setSize(Math.max(width + nextMinWidth - prevMinWidth, nextMinWidth), height);
    }
  }
}
