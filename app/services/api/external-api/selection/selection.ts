import { SelectionService as InternalSelectionService } from 'services/selection';
import { Fallback, Singleton } from 'services/api/external-api';
import { Selection } from 'services/api/external-api/scenes/selection';
import { Inject } from 'util/injector';

/**
 * Allows select/deselect items and call bulk actions on Scene Items.
 * Works only with the currently active scene.
 */
@Singleton()
export class SelectionService extends Selection {
  @Fallback()
  @Inject('SelectionService')
  private internalSelectionService: InternalSelectionService;

  get selection() {
    return this.internalSelectionService;
  }
}
