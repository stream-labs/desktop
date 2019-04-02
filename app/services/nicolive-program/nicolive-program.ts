import { StatefulService, mutation } from 'services/stateful-service';
import { NicoliveClient, CreateResult, EditResult, isOk } from './NicoliveClient';
import { ProgramSchedules } from './ResponseTypes';
import { Inject } from 'util/injector';
import { NicoliveProgramStateService } from './state';
import { WindowsService } from 'services/windows';
import { UserService } from 'services/user';

type Schedules = ProgramSchedules['data'];
type Schedule = Schedules[0];
interface INicoliveProgramState {
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
  /**
   * 自動延長状態をコンポーネントに伝えるための一時置き場
   * 直接ここを編集してはいけない、stateServiceの操作結果を反映するだけにする
   */
  autoExtensionEnabled: boolean;
  panelOpened: boolean;
}

enum PanelState {
  INACTIVE = 'INACTIVE',
  OPENED = 'OPENED',
  CLOSED = 'CLOSED',
}

const WINDOW_MIN_WIDTH: { [key in PanelState]: number } = {
  INACTIVE: 800, // 初期値
  OPENED: 800 + 400 + 24, // +パネル幅+開閉ボタン幅
  CLOSED: 800 + 24, // +開閉ボタン幅
};

export class NicoliveProgramService extends StatefulService<INicoliveProgramState> {
  @Inject('NicoliveProgramStateService') stateService: NicoliveProgramStateService;
  @Inject()
  windowsService: WindowsService;
  @Inject()
  userService: UserService;

  client: NicoliveClient = new NicoliveClient();

  static initialState: INicoliveProgramState = {
    programID: '',
    status: 'end',
    title: '',
    description: '',
    endTime: 0,
    startTime: 0,
    isMemberOnly: false,
    communityID: '',
    communityName: '',
    communitySymbol: '',
    viewers: 0,
    comments: 0,
    adPoint: 0,
    giftPoint: 0,
    autoExtensionEnabled: false,
    panelOpened: true,
  };

  init(): void {
    super.init();

    this.stateService.updated.subscribe({
      next: ({ autoExtensionEnabled }) => {
        this.setState({ autoExtensionEnabled });
      }
    });

    this.userService.userLoginState.subscribe(user => {
      const isLoggedIn = Boolean(user);
      const panelState = NicoliveProgramService.getPanelState(this.state.panelOpened, isLoggedIn);
      this.updateWindowSize(panelState);
    });
  }

  private setState(partialState: Partial<INicoliveProgramState>) {
    const nextState = { ...this.state, ...partialState };
    this.refreshStatisticsPolling(this.state, nextState);
    this.refreshProgramStatusTimer(this.state, nextState);
    this.refreshAutoExtensionTimer(this.state, nextState);
    this.refreshWindowConstraints(this.state, nextState);
    this.SET_STATE(nextState);
  }

  @mutation()
  private SET_STATE(nextState: INicoliveProgramState): void {
    this.state = nextState;
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
      console.warn(schedulesResponse.value.meta.errorCode);
      throw schedulesResponse.value;
    }

    const programSchedule = NicoliveProgramService.findSuitableProgram(schedulesResponse.value);

    if (!programSchedule) {
      this.setState({ status: 'end' });
      throw new Error('no suitable schedule');
    }
    const { nicoliveProgramId, socialGroupId } = programSchedule;

    const [programResponse, communityResponse] = await Promise.all([
      this.client.fetchProgram(nicoliveProgramId),
      this.client.fetchCommunity(socialGroupId),
    ]);
    if (!isOk(programResponse)) {
      console.warn(programResponse.value.meta.errorCode);
      throw programResponse.value;
    }
    if (!isOk(communityResponse)) {
      console.warn(communityResponse.value.meta.errorCode);
      throw communityResponse.value;
    }

    const community = communityResponse.value;
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
      communityName: community.name,
      communitySymbol: community.thumbnailUrl.small,
    });
  }

  async refreshProgram(): Promise<void> {
    const programResponse = await this.client.fetchProgram(this.state.programID);
    if (!isOk(programResponse)) {
      console.warn(programResponse.value.meta.errorCode);
      throw programResponse.value;
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
    if (!isOk(result)) throw result.value;

    const endTime = result.value.end_time;
    const startTime = result.value.start_time;
    this.setState({ status: 'onAir', endTime, startTime });
  }

  async endProgram(): Promise<void> {
    const result = await this.client.endProgram(this.state.programID);
    if (!isOk(result)) throw result.value;

    const endTime = result.value.end_time;
    this.setState({ status: 'end', endTime });
  }

  toggleAutoExtension(): void {
    this.stateService.toggleAutoExtension();
  }

  async extendProgram(): Promise<void> {
    const result = await this.client.extendProgram(this.state.programID);
    if (!isOk(result)) throw result.value;

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
    if (!isOk(result)) throw result.value;
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

  updatePanelOpened(panelOpened: boolean): void {
    this.setState({ panelOpened });
  }

  static getPanelState(panelOpened: boolean, isLoggedIn: boolean): PanelState {
    if (!isLoggedIn) return 'INACTIVE' as PanelState;
    return panelOpened ? ('OPENED' as PanelState) : ('CLOSED' as PanelState);
  }

  /** パネルが出る幅の分だけ画面の最小幅を拡張する */
  refreshWindowConstraints(prevState: INicoliveProgramState, nextState: INicoliveProgramState): void {
    if (prevState.panelOpened === nextState.panelOpened) return;
    const isLoggedIn = this.userService.isLoggedIn();
    const panelState = NicoliveProgramService.getPanelState(nextState.panelOpened, isLoggedIn);
    this.updateWindowSize(panelState);
  }

  /*
   * TODO: 最小幅が変動するときにその差分だけ実際の幅を操作する（初期状態を考慮するとパネル開閉状態の永続化が必要）
   * NOTE: 似た処理を他所にも書きたくなったらウィンドウ幅を管理する存在を置くべきで、コピペは悪いことを言わないのでやめておけ
   * このコメントを書いている時点でメインウィンドウのウィンドウ幅を操作する存在は他にいない
   */
  updateWindowSize(state: PanelState): void {
    const win = this.windowsService.getWindow('main');
    const [, minHeight] = win.getMinimumSize();
    const [width, height] = win.getSize();
    const newMinWidth = WINDOW_MIN_WIDTH[state];
    win.setMinimumSize(newMinWidth, minHeight);
    win.setSize(Math.max(width, newMinWidth), height);
  }
}
