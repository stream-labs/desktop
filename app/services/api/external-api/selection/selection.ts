import { SelectionService as InternalSelectionService } from 'services/selection';
import { Fallback, Singleton } from 'services/api/external-api';
import { Selection } from 'services/api/external-api/scenes/selection';
import { Inject } from 'services';

/**
 * API for selection management. Allows selecting/deselecting items and bulk
 * action calls on scene nodes. Works only with the currently active scene.
 */
@Singleton()
export class SelectionService extends Selection {
  @Fallback()
  @Inject('SelectionService')
  private internalSelectionService: InternalSelectionService;

  get sceneId(): string {
    return this.selection.sceneId;
  }

  protected get selection() {
    return this.internalSelectionService.views.globalSelection;
  }
}
