import { TransitionsService as InternalTransitionsService } from 'services/transitions';
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { Observable } from 'rxjs';
import { ISerializable } from 'services/api/rpc-api';

/**
 * Serialized representation of {@link TransitionsService}.
 */
export interface ITransitionsServiceState {
  studioMode: boolean;
}

/**
 * API for studio mode state and transitions management. Contains operations for
 * toggling studio mode and provides observables for studio mode events
 * registration.
 */
@Singleton()
export class TransitionsService implements ISerializable {
  @Fallback()
  @Inject()
  protected transitionsService: InternalTransitionsService;

  /**
   * Observable event that is triggered whenever the studio mode is changed. The
   * observed value determines if the studio mode is active or not.
   */
  get studioModeChanged(): Observable<boolean> {
    return this.transitionsService.studioModeChanged;
  }

  /**
   * @returns A serialized representation of the studio mode state.
   */
  getModel(): ITransitionsServiceState {
    return {
      studioMode: this.transitionsService.state.studioMode,
    };
  }

  /**
   * Enables the studio mode.
   */
  enableStudioMode(): void {
    this.transitionsService.enableStudioMode();
  }

  /**
   * Disables the studio mode.
   */
  disableStudioMode(): void {
    this.transitionsService.disableStudioMode();
  }

  /**
   * While in studio mode, will execute a studio mode transition.
   */
  executeStudioModeTransition(): void {
    this.transitionsService.executeStudioModeTransition();
  }
}
