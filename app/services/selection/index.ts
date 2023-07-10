import electron from 'electron';
import { mutation, StatefulService, Inject } from 'services';
import { ISceneItemNode, ScenesService } from 'services/scenes';
import { $t } from 'services/i18n';
import { shortcut } from 'services/shortcuts';
import { BehaviorSubject } from 'rxjs';
import Utils from 'services/utils';
import { WindowsService } from 'services/windows';
import { EditorCommandsService } from 'services/editor-commands';
import { Selection } from './selection';
import { ViewHandler } from 'services/core';
import { GlobalSelection } from './global-selection';
import { DualOutputService } from 'app-services';

export { Selection, GlobalSelection };

export interface ISelectionState {
  selectedIds: string[];
  lastSelectedId: string;
}

/**
 * list of ISceneNode.id or ISceneNode
 */
export type TNodesList = string | string[] | ISceneItemNode | ISceneItemNode[];

class SelectionViews extends ViewHandler<ISelectionState> {
  get globalSelection() {
    return new GlobalSelection();
  }

  get lastSelectedId() {
    return this.state.lastSelectedId;
  }
}

/**
 * represents selection of active scene and provide shortcuts
 */
export class SelectionService extends StatefulService<ISelectionState> {
  static initialState: ISelectionState = {
    selectedIds: [],
    lastSelectedId: '',
  };

  updated = new BehaviorSubject<ISelectionState>({
    selectedIds: [],
    lastSelectedId: '',
  });

  @Inject() private scenesService: ScenesService;
  @Inject() private windowsService: WindowsService;
  @Inject() private editorCommandsService: EditorCommandsService;
  @Inject() private dualOutputService: DualOutputService;

  init() {
    this.scenesService.sceneSwitched.subscribe(() => {
      this.views.globalSelection.reset();
    });
  }

  get views() {
    return new SelectionViews(this.state);
  }

  @shortcut('Delete')
  removeSelected() {
    this.views.globalSelection.remove();
  }

  openEditTransform() {
    this.associateSelectionWithDisplay();
    const windowHeight = this.views.globalSelection.isSceneItem() ? 500 : 300;
    this.windowsService.showWindow({
      componentName: 'EditTransform',
      title: $t('Edit Transform'),
      size: { width: 580, height: windowHeight },
    });
  }

  associateSelectionWithDisplay() {
    if (this.dualOutputService.views.dualOutputMode) {
      const lastSelected = this.scenesService.views.getSceneItem(this.views.lastSelectedId);
      const filter = lastSelected.display;

      // If the most recent selected node has a display associated,
      // check if there are nodes selected in the other display
      if (filter) {
        const selectedItems = this.state.selectedIds.map(id =>
          this.scenesService.views.getSceneItem(id),
        );
        const requireFilter = selectedItems.some(item => item.display !== filter);

        // If nodes in both displays are selected, alter selection to only include
        // items in the last display selected
        if (requireFilter) {
          const filteredIds = selectedItems
            .filter(item => item.display === filter)
            .map(item => item.id);
          this.select(filteredIds);
        }
      }
    }
  }

  select(items: TNodesList): void {
    const selection = new Selection(this.scenesService.views.activeSceneId, items);
    const scene = selection.getScene();
    const activeObsIds = selection.getItems().map(sceneItem => sceneItem.obsSceneItemId);
    const model = selection.getModel();

    this.SET_STATE({
      lastSelectedId: model.lastSelectedId,
      selectedIds: model.selectedIds,
    });
    this.updated.next(this.state);

    // tell OBS which sceneItems are selected
    scene
      .getObsScene()
      .getItems()
      .forEach(obsSceneItem => {
        obsSceneItem.selected = activeObsIds.includes(obsSceneItem.id);
      });
  }

  @mutation()
  private SET_STATE(state: Partial<ISelectionState>) {
    Object.assign(this.state, state);
  }
}

// Apply a mixin to selection service to have a reactive state
Utils.applyMixins(SelectionService, [Selection]);
