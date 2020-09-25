import { Selection } from './selection';
import { Inject } from 'services/core';
import { SelectionService, ISelectionState, TNodesList } from 'services/selection';
import { $t } from 'services/i18n';
import electron from 'electron';
import Utils from 'services/utils';
import { EditorCommandsService } from 'services/editor-commands';

/**
 * A specific case of a selection that represents what
 * the user currently has selected in the UI. The primary
 * differences are that the state is backed by the Vuex
 * store in the SelectionService, and selecting items
 * actually selects them in OBS.
 */
export class GlobalSelection extends Selection {
  @Inject() selectionService: SelectionService;
  @Inject() editorCommandsService: EditorCommandsService;

  protected get state() {
    return this.selectionService.state;
  }

  get sceneId() {
    return this.scenesService.views.activeSceneId;
  }

  // Ensures compatibiltiy with parent class
  set sceneId(val: string) {}
  protected set state(val: ISelectionState) {}

  remove() {
    const lastSelected = this.getLastSelected();

    if (!lastSelected) return;

    const name = lastSelected.name;
    const selectionLength = this.getIds().length;
    const message =
      selectionLength > 1
        ? $t('Are you sure you want to remove these %{count} items?', { count: selectionLength })
        : $t('Are you sure you want to remove %{sceneName}?', { sceneName: name });

    electron.remote.dialog
      .showMessageBox(Utils.getMainWindow(), {
        message,
        type: 'warning',
        buttons: [$t('Cancel'), $t('OK')],
      })
      .then(({ response }) => {
        if (!response) return;
        this.editorCommandsService.executeCommand('RemoveNodesCommand', this.clone());
      });
  }

  select(items: TNodesList) {
    // this.getSelection().select.call(this, items);
    super.select(items);

    const scene = this.getScene();
    const activeObsIds = this.getItems().map(sceneItem => sceneItem.obsSceneItemId);

    // tell OBS which sceneItems are selected
    scene
      .getObsScene()
      .getItems()
      .forEach(obsSceneItem => {
        obsSceneItem.selected = activeObsIds.includes(obsSceneItem.id);
      });
    this.selectionService.updated.next(this.state);

    return this;
  }

  /**
   * Sets the state on the Vuex store. Is done synchronously
   * to avoid race conditions.
   */
  protected setState(state: Partial<ISelectionState>) {
    this.selectionService.setState(state);
  }
}
