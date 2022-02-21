import { BrowserWindow } from 'electron';
import { BehaviorSubject } from 'rxjs';
import { Inject } from './core/injector';
import { mutation, StatefulService } from './core/stateful-service';
import { CustomizationService } from './customization/customization';
import { NicoliveProgramStateService } from './nicolive-program/state';
import { UserService } from './user';
import { WindowsService } from './windows';

interface IWindowSizeState {
  panelOpened: boolean | null; // 初期化前はnull、永続化された値の読み出し後に値が入る
  isLoggedIn: boolean | null; // 初期化前はnull、永続化された値の読み出し後に値が入る
  isCompact: boolean | null;
}

const STUDIO_WIDTH = 800;
const SIDENAV_WIDTH = 48;
const NICOLIVE_PANEL_WIDTH = 400;
const PANEL_DIVIDER_WIDTH = 24;

export enum PanelState {
  INACTIVE = 'INACTIVE',
  OPENED = 'OPENED',
  CLOSED = 'CLOSED',
  COMPACT = 'COMPACT',
}

type BackupSizeInfo = {
  widthOffset: number;
  backupX: number;
  backupY: number;
  backupHeight: number;
};

export class WindowSizeService extends StatefulService<IWindowSizeState> {
  @Inject() windowsService: WindowsService;
  @Inject() customizationService: CustomizationService;
  @Inject() userService: UserService;
  @Inject() nicoliveProgramStateService: NicoliveProgramStateService;

  static initialState: IWindowSizeState = {
    panelOpened: null,
    isLoggedIn: null,
    isCompact: null,
  };

  private stateChangeSubject = new BehaviorSubject(this.state);
  stateChange = this.stateChangeSubject.asObservable();

  init(): void {
    super.init();

    this.nicoliveProgramStateService.updated.subscribe({
      next: persistentState => {
        if ('panelOpened' in persistentState) {
          this.setState({ panelOpened: persistentState.panelOpened });
        }
      },
    });

    this.userService.userLoginState.subscribe({
      next: user => {
        this.setState({ isLoggedIn: Boolean(user) });
      },
    });

    this.customizationService.settingsChanged.subscribe({
      next: compact => {
        if ('compactMode' in compact) {
          this.setState({ isCompact: compact.compactMode });
        }
      },
    });

    // UserServiceのSubjectをBehaviorに変更するのは影響が広すぎる
    this.setState({
      isLoggedIn: this.userService.isLoggedIn(),
      isCompact: this.customizationService.state.compactMode,
    });
  }

  private setState(partialState: Partial<IWindowSizeState>) {
    const nextState = { ...this.state, ...partialState };
    this.refreshWindowSize(this.state, nextState);
    this.SET_STATE(nextState);
    this.stateChangeSubject.next(nextState);
  }

  @mutation()
  private SET_STATE(nextState: IWindowSizeState): void {
    this.state = nextState;
  }

  static getPanelState({
    panelOpened,
    isLoggedIn,
    isCompact,
  }: {
    panelOpened: boolean;
    isLoggedIn: boolean;
    isCompact: boolean;
  }): PanelState | null {
    if (panelOpened === null || isLoggedIn === null) return null;
    if (isCompact) return PanelState.COMPACT;
    if (!isLoggedIn) return PanelState.INACTIVE;
    return panelOpened ? PanelState.OPENED : PanelState.CLOSED;
  }

  /** パネルが出る幅の分だけ画面の最小幅を拡張する */
  refreshWindowSize(prevState: IWindowSizeState, nextState: IWindowSizeState): void {
    const prevPanelState = WindowSizeService.getPanelState(prevState);
    const nextPanelState = WindowSizeService.getPanelState(nextState);
    if (nextPanelState !== null && prevPanelState !== nextPanelState) {
      const newSize = WindowSizeService.updateWindowSize(
        this.windowsService.getWindow('main'),
        prevPanelState,
        nextPanelState,
        {
          widthOffset: this.customizationService.state.fullModeWidthOffset,
          backupX: this.customizationService.state.compactBackupPositionX,
          backupY: this.customizationService.state.compactBackupPositionY,
          backupHeight: this.customizationService.state.compactBackupHeight,
        },
      );
      if (prevPanelState && newSize !== undefined) {
        this.customizationService.setFullModeWidthOffset({
          fullModeWidthOffset: newSize.widthOffset,
          compactBackupPositionX: newSize.backupX,
          compactBackupPositionY: newSize.backupY,
          compactBackupHeight: newSize.backupHeight,
        });
      }
    }
  }

  static WINDOW_MIN_WIDTH: { [key in PanelState]: number } = {
    INACTIVE: SIDENAV_WIDTH + STUDIO_WIDTH, // 通常値
    OPENED: SIDENAV_WIDTH + STUDIO_WIDTH + NICOLIVE_PANEL_WIDTH + PANEL_DIVIDER_WIDTH, // +パネル幅+開閉ボタン幅
    CLOSED: SIDENAV_WIDTH + STUDIO_WIDTH + PANEL_DIVIDER_WIDTH, // +開閉ボタン幅
    COMPACT: SIDENAV_WIDTH + NICOLIVE_PANEL_WIDTH, // コンパクトモードはパネル幅+
  };

  /*
   * NOTE: 似た処理を他所にも書きたくなったらウィンドウ幅を管理する存在を置くべきで、コピペは悪いことを言わないのでやめておけ
   * このコメントを書いている時点でメインウィンドウのウィンドウ幅を操作する存在は他にいない
   */
  static updateWindowSize(
    win: BrowserWindow,
    prevState: PanelState,
    nextState: PanelState,
    sizeState: BackupSizeInfo | undefined,
  ): BackupSizeInfo {
    if (nextState === null) throw new Error('nextState is null');
    const onInit = !prevState;

    const [, minHeight] = win.getMinimumSize();
    const [width, height] = win.getSize();
    let nextHeight = height;
    const nextMinWidth = WindowSizeService.WINDOW_MIN_WIDTH[nextState];
    const INT32_MAX = Math.pow(2, 31) - 1; // BIG ENOUGH VALUE (0が指定したいが、一度0以外を指定すると0に再設定できないため)
    const nextMaxWidth = nextState === PanelState.COMPACT ? nextMinWidth : INT32_MAX;
    let nextWidth = width;
    const newSize = {
      widthOffset: sizeState?.widthOffset,
      backupX: sizeState?.backupX,
      backupY: sizeState?.backupY,
      backupHeight: sizeState?.backupHeight,
    };

    if (onInit) {
      // 復元されたウィンドウ幅が復元されたパネル状態の最小幅を満たさない場合、最小幅まで広げる
      if (width < nextMinWidth || nextState === PanelState.COMPACT) {
        nextWidth = nextMinWidth;
      }
    } else {
      // ウィンドウ幅とログイン状態・パネル開閉状態の永続化が別管理なので、初期化が終わって情報が揃ってから更新する
      // 最大化されているときはウィンドウサイズを操作しない（画面外に飛び出したりして不自然なことになる）
      if (!win.isMaximized()) {
        // コンパクトモード以外だったときは現在の幅と最小幅の差を保存する
        if (prevState !== PanelState.COMPACT) {
          newSize.widthOffset = Math.max(0, width - WindowSizeService.WINDOW_MIN_WIDTH[prevState]);
        }

        // コンパクトモードになるときはパネルサイズを強制する
        if (nextState === PanelState.COMPACT) {
          nextWidth = nextMinWidth;
        } else {
          nextWidth = nextMinWidth + newSize.widthOffset;
        }
      }
    }

    if (
      prevState !== null &&
      (prevState === PanelState.COMPACT) !== (nextState === PanelState.COMPACT)
    ) {
      const [x, y] = win.getPosition();
      if (newSize.backupX !== undefined && newSize.backupY !== undefined) {
        win.setPosition(newSize.backupX, newSize.backupY);
      }
      if (newSize.backupHeight !== undefined) {
        nextHeight = newSize.backupHeight;
      }
      newSize.backupX = x;
      newSize.backupY = y;
      newSize.backupHeight = height;
    }

    win.setMinimumSize(nextMinWidth, minHeight);
    win.setMaximumSize(nextMaxWidth, 0);
    if (nextWidth !== width || nextHeight !== height) {
      win.setSize(nextWidth, nextHeight);
    }

    return newSize;
  }
}
