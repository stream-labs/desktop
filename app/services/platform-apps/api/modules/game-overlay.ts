import { Module, EApiPermissions, apiMethod, apiEvent } from './module';
import { GameOverlayService } from 'app-services';
import { StreamingService, EStreamingState, ERecordingState } from 'services/streaming';
import { Inject } from 'services/core/injector';
import { Subject } from 'rxjs';

interface IGameOverlayState {
  isEnabled: boolean;
  isShowing: boolean;
}

export class GameOverlayModule extends Module {
  moduleName = 'GameOverlay';

  // TODO: define under which permission this should fall over, if any
  permissions = [] as EApiPermissions[];

  @Inject() private gameOverlayService: GameOverlayService;

  @apiEvent()
  overlayStatusChanged = new Subject<IGameOverlayState>();

  constructor() {
    super();

    this.gameOverlayService.overlayStatusChanged.subscribe(() => {
      this.overlayStatusChanged.next(this.serializeOverlayStatus());
    });
  }

  @apiMethod()
  getGameOverlayStatus(): IGameOverlayState {
    return this.serializeOverlayStatus();
  }

  private serializeOverlayStatus(): IGameOverlayState {
    const state = this.gameOverlayService.state;

    return {
      isEnabled: state.isEnabled,
      isShowing: state.isShowing,
    };
  }
}
