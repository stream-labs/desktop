import { GameOverlayService as InternalGameOverlayService } from 'services/game-overlay';
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { Observable } from 'rxjs';
import { ISerializable } from 'services/api/rpc-api';

/**
 * Possible game overlay states
 */
enum EGameOverlayState {
  Disabled = 'disabled',
  Enabled = 'enabled',
}

enum EGameOverlayVisibility {
  Hidden = 'hidden',
  Visible = 'visible',
}

interface EGameOverlayModel {
  isEnabled: boolean;
  isShowing: boolean;
  isPreviewEnabled: boolean;
}

/** API for controlling and getting state of the game overlay. */
@Singleton()
export class GameOverlayService implements ISerializable {
  @Fallback()
  @Inject()
  private internalGameOverlayService: InternalGameOverlayService;

  /**
   * Observable event that is triggered whenever the game overlay
   * status changes due to being enabled or disabled.
   *
   * The value of this event is the current game overlay enabled state,
   * and is represented by {@link EGameOverlayState}.
   *
   * @see EGameOverlayState
   */
  get overlayStatusChanged(): Observable<EGameOverlayState> {
    return this.internalGameOverlayService.overlayStatusChanged;
  }

  /**
   * Observable event that is triggered whenever the game overlay
   * visibility changes due to being shown or hidden.
   *
   * The value of this event is the current game overlay visibility state,
   * and is represented by {@link EGameOverlayVisibility}.
   *
   * @see EGameOverlayVisibility
   */
  get overlayVisibilityChanged(): Observable<EGameOverlayVisibility> {
    return this.internalGameOverlayService.overlayVisibilityChanged;
  }

  /**
   * Returns the current game overlay state represented.
   *
   * @returns A serialized representation of {@link GameOverlayService}
   */
  getModel(): EGameOverlayModel {
    const state = this.internalGameOverlayService.state;
    return {
      isEnabled: state.isEnabled,
      isPreviewEnabled: state.isPreviewEnabled,
      isShowing: state.isShowing,
    };
  }

  /**
   * Enables the game overlay.
   */
  enable(): void {
    this.internalGameOverlayService.setEnabled(true);
  }

  /**
   * Disables the game overlay.
   */
  disable(): void {
    this.internalGameOverlayService.setEnabled(false);
  }

  /**
   * Shows the game overlay.
   *
   * Has no effect if the overlay isn't enabled.
   */
  show(): void {
    this.internalGameOverlayService.showOverlay();
  }

  /**
   * Hides the game overlay.
   *
   * Has no effect if the overlay isn't enabled.
   */
  hide(): void {
    this.internalGameOverlayService.hideOverlay();
  }
}
