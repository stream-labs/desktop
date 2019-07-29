import { TransitionsService as InternalTransitionsService } from 'services/transitions';
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { Observable } from 'rxjs';
import { ISerializable } from 'services/api/rpc-api';

export interface ITransitionsServiceState {
  studioMode: boolean;
}

/**
 * Manage the studio mode transitions
 */
@Singleton()
export class TransitionsService implements ISerializable {
  @Fallback()
  @Inject()
  protected transitionService: InternalTransitionsService;

  get studioModeChanged(): Observable<boolean> {
    return this.transitionService.studioModeChanged;
  }

  getModel(): ITransitionsServiceState {
    return {
      studioMode: this.transitionService.state.studioMode,
    };
  }

  enableStudioMode() {
    this.transitionService.enableStudioMode();
  }

  disableStudioMode() {
    this.transitionService.disableStudioMode();
  }

  /**
   * While in studio mode, will execute a studio mode transition
   */
  executeStudioModeTransition() {
    this.transitionService.executeStudioModeTransition();
  }
}
