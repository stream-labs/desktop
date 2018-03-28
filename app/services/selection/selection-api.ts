import {
  ISceneItemActions,
  ISceneItemApi,
  ISceneItem,
  TSceneNodeApi,
  ISceneItemNode,
  ISceneItemFolderApi
} from 'services/scenes';


export interface ISelectionServiceApi extends ISelection {
}


export interface ISelection extends ISceneItemActions {
  add(items: TNodesList): ISelection;
  select(items: TNodesList): ISelection;
  deselect(items: TNodesList): ISelection;
  reset(): ISelection;
  invert(): ISelection;
  selectAll(): ISelection;
  clone(): ISelection;
  getItems(): ISceneItemApi[];
  getFolders(): ISceneItemFolderApi[];
  getVisualItems(): ISceneItemApi[];
  getIds(): string[];
  getInvertedIds(): string[];
  getInverted(): TSceneNodeApi[];
  getBoundingRect(): IRectangle;
  getLastSelected(): ISceneItemApi;
  getLastSelectedId(): string;
  getSize(): number;
  isSelected(item: string | ISceneItem): void;
  isSceneItem(): boolean;
  isSceneFolder(): boolean;
  copyTo(sceneId: string): ISceneItem[];
  copyReferenceTo(sceneId: string, folderId?: string): TSceneNodeApi[];
  moveTo(sceneId: string, folderId?: string): TSceneNodeApi[];
}

export interface ISelectionState {
  selectedIds: string[];
  lastSelectedId: string;
}

/**
 * list of ISceneNode.id or ISceneNode
 */
export type TNodesList = string | string[] | ISceneItemNode | ISceneItemNode[];
