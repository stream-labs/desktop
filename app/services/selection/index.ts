import electron from 'electron';
import { mutation, StatefulService, Inject } from 'services';
import {
  IPartialTransform,
  ISceneItem,
  ISceneItemNode,
  ISceneItemSettings,
  Scene,
  SceneItem,
  SceneItemFolder,
  ScenesService,
  TSceneNode,
} from 'services/scenes';
import { $t } from 'services/i18n';
import { shortcut } from 'services/shortcuts';
import { Subject } from 'rxjs';
import Utils from 'services/utils';
import { Source } from 'services/sources';
import { Rect } from 'util/rect';
import { WindowsService } from 'services/windows';
import { EditorCommandsService } from 'services/editor-commands';
import { Selection } from './selection';

export { Selection };

export interface ISelectionState {
  selectedIds: string[];
  lastSelectedId: string;
}

/**
 * list of ISceneNode.id or ISceneNode
 */
export type TNodesList = string | string[] | ISceneItemNode | ISceneItemNode[];

/**
 * represents selection of active scene and provide shortcuts
 */
export class SelectionService extends StatefulService<ISelectionState> {
  static initialState: ISelectionState = {
    selectedIds: [],
    lastSelectedId: '',
  };

  updated = new Subject<ISelectionState>();

  get sceneId() {
    return this.scenesService.activeSceneId;
  }

  @Inject() private scenesService: ScenesService;
  @Inject() private windowsService: WindowsService;
  @Inject() private editorCommandsService: EditorCommandsService;

  init() {
    this.scenesService.sceneSwitched.subscribe(() => {
      this.reset();
    });
  }

  // SELECTION METHODS

  add: (items: TNodesList) => Selection;
  deselect: (items: TNodesList) => Selection;
  reset: () => Selection;
  selectAll: () => Selection;
  clone: () => Selection;
  invert: () => Selection;
  getItems: () => SceneItem[];
  getNodes: () => TSceneNode[];
  getFolders: () => SceneItemFolder[];
  getVisualItems: () => SceneItem[];
  getIds: () => string[];
  getInvertedIds: () => string[];
  getInverted: () => TSceneNode[];
  getBoundingRect: () => Rect;
  getLastSelected: () => SceneItem;
  getLastSelectedId: () => string;
  getSize: () => number;
  isSelected: (item: string | ISceneItem) => boolean;
  copyTo: (sceneId: string, folderId?: string, duplicateSources?: boolean) => TSceneNode[];
  moveTo: (sceneId: string, folderId?: string) => TSceneNode[];
  isSceneItem: () => boolean;
  isSceneFolder: () => boolean;
  canGroupIntoFolder: () => boolean;
  getClosestParent: () => SceneItemFolder;
  getRootNodes: () => TSceneNode[];
  getSources: () => Source[];
  setStreamVisible: (streamVisible: boolean) => void;
  setRecordingVisible: (recordingVisible: boolean) => void;

  // SCENE_ITEM METHODS

  setSettings: (settings: Partial<ISceneItemSettings>) => void;
  setVisibility: (isVisible: boolean) => void;
  setTransform: (transform: IPartialTransform) => void;
  setDeltaPos: (dir: 'x' | 'y', delta: number) => void;
  resetTransform: () => void;
  scale: (scale: IVec2, origin?: IVec2) => void;
  scaleWithOffset: (scale: IVec2, offset: IVec2) => void;
  flipY: () => void;
  flipX: () => void;
  stretchToScreen: () => void;
  fitToScreen: () => void;
  centerOnScreen: () => void;
  centerOnHorizontal: () => void;
  centerOnVertical: () => void;
  rotate: (deg: number) => void;
  setContentCrop: () => void;

  // SCENE NODES METHODS
  placeAfter: (sceneNodeId: string) => void;
  placeBefore: (sceneNodeId: string) => void;
  setParent: (folderId: string) => void;

  @shortcut('Delete')
  remove() {
    const lastSelected = this.getLastSelected();

    if (!lastSelected) return;

    const name = lastSelected.name;
    const selectionLength = this.getSelection().getIds.call(this).length;
    const message =
      selectionLength > 1
        ? $t('Are you sure you want to remove these %{count} items?', { count: selectionLength })
        : $t('Are you sure you want to remove %{sceneName}?', { sceneName: name });

    electron.remote.dialog
      .showMessageBox(electron.remote.getCurrentWindow(), {
        message,
        type: 'warning',
        buttons: [$t('Cancel'), $t('OK')],
      })
      .then(({ response }) => {
        if (!response) return;
        this.editorCommandsService.executeCommand('RemoveNodesCommand', this.getActiveSelection());
      });
  }

  openEditTransform() {
    const windowHeight = this.isSceneItem() ? 460 : 300;
    this.windowsService.showWindow({
      componentName: 'EditTransform',
      title: $t('Edit Transform'),
      size: { width: 500, height: windowHeight },
    });
  }

  /**
   * @override Selection.select
   */
  select(items: TNodesList): void {
    this.getSelection().select.call(this, items);

    const scene = this.getScene();
    const activeObsIds = this.getItems().map(sceneItem => sceneItem.obsSceneItemId);

    // tell OBS which sceneItems are selected
    scene
      .getObsScene()
      .getItems()
      .forEach(obsSceneItem => {
        obsSceneItem.selected = activeObsIds.includes(obsSceneItem.id);
      });
    this.updated.next(this.state);
  }

  getActiveSelection() {
    return new Selection(this.sceneId, this.getIds());
  }

  /**
   * @override Selection.getScene
   */
  private getScene(): Scene {
    return this.scenesService.activeScene;
  }

  private getSelection(): Selection {
    return Selection.prototype;
  }

  /**
   * @override Selection.setState
   */
  private setState(state: Partial<ISelectionState>) {
    this.SET_STATE(state);
  }

  @mutation()
  private SET_STATE(state: Partial<ISelectionState>) {
    Object.assign(this.state, state);
  }
}

// Apply a mixin to selection service to have a reactive state
Utils.applyMixins(SelectionService, [Selection]);
