import { Inject } from './core/injector';
import { mutation, StatefulService } from './core/stateful-service';
import {
  CustomizationService,
  TCompactModeStudioController,
  TCompactModeTab,
} from './customization';
import { $t } from './i18n';
import { NicoliveProgramService } from './nicolive-program/nicolive-program';
import { StreamingService } from './streaming';
import { UserService } from './user';
import Utils from './utils';
import { WindowsService } from './windows';

export interface ICompactModeServiceState {
  streaming: boolean;
  programStarted: boolean;
  autoCompactMode: boolean;
}

function shouldBeCompact(state: ICompactModeServiceState): boolean {
  return state.streaming && state.programStarted;
}

export class CompactModeService extends StatefulService<ICompactModeServiceState> {
  @Inject() customizationService: CustomizationService;
  @Inject() userService: UserService;
  @Inject() streamingService: StreamingService;
  @Inject() nicoliveProgramService: NicoliveProgramService;
  @Inject() windowsService: WindowsService;

  static defaultState: ICompactModeServiceState = {
    streaming: false,
    programStarted: false,
    autoCompactMode: false,
  };

  init(): void {
    super.init();
    this.setState({
      autoCompactMode: this.customizationService.state.autoCompactMode,
      streaming: this.streamingService.state.streamingStatus !== 'offline',
      programStarted: this.nicoliveProgramService.state.status === 'onAir',
    });
    this.customizationService.settingsChanged.subscribe(state => {
      if ('autoCompactMode' in state) {
        this.setState({ autoCompactMode: state.autoCompactMode });
      }
    });
    this.streamingService.streamingStatusChange.subscribe(state => {
      this.setState({ streaming: state !== 'offline' });
    });
    this.nicoliveProgramService.stateChange.subscribe(state => {
      this.setState({ programStarted: state.status === 'onAir' });
    });
  }

  private setState(statePatch: Partial<ICompactModeServiceState>) {
    const prevCompact = shouldBeCompact(this.state);
    const prevAutoCompact = this.state.autoCompactMode;
    statePatch = Utils.getChangedParams(this.state, statePatch);
    this.SET_STATE(statePatch);
    const newCompact = shouldBeCompact(this.state);

    if (this.state.autoCompactMode) {
      if (prevCompact !== newCompact || !prevAutoCompact) {
        this.customizationService.setCompactMode(newCompact);
      }
    } else {
      if (this.customizationService.state.showAutoCompactDialog) {
        if (!prevCompact && newCompact && !this.customizationService.state.compactMode) {
          this.windowsService.showWindow({
            title: $t('settings.autoCompact.title'),
            componentName: 'AutoCompactConfirmDialog',
            size: {
              width: 500,
              height: 500,
            },
          });
        }
      }
    }
  }

  toggleCompactMode() {
    this.customizationService.toggleCompactMode();
  }
  set compactMode(value: boolean) {
    this.customizationService.setCompactMode(value);
  }
  get compactMode(): boolean {
    return this.customizationService.state.compactMode;
  }

  set compactModeTab(tab: TCompactModeTab) {
    this.customizationService.setCompactModeTab(tab);
  }
  get compactModeTab(): TCompactModeTab {
    if (this.userService.isLoggedIn()) {
      return this.customizationService.state.compactModeTab || 'studio';
    }
    return 'studio';
  }
  // 新着コメント通知フラグ
  get notifyNewComment(): boolean {
    return (
      this.compactModeTab !== 'niconico' && this.customizationService.state.compactModeNewComment
    );
  }

  set compactModeStudioController(controller: TCompactModeStudioController) {
    this.customizationService.setCompactModeStudioController(controller);
  }
  get compactModeStudioController(): TCompactModeStudioController {
    return this.customizationService.state.compactModeStudioController;
  }

  @mutation()
  private SET_STATE(statePatch: Partial<ICompactModeServiceState>) {
    Object.assign(this.state, statePatch);
  }
}
