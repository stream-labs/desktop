import { ISceneItemActions, ISceneItemApi, ISceneItem } from 'services/scenes';

export interface ISelectionServiceApi extends ISelection {
}


export interface ISelection extends ISceneItemActions {
  add(items: TItemsList): ISelection;
  select(items: TItemsList): ISelection;
  deselect(items: TItemsList): ISelection;
  reset(): ISelection;
  invert(): ISelection;
  selectAll(): ISelection;
  getItems(): ISceneItemApi[];
  getVisualItems(): ISceneItemApi[];
  getIds(): string[];
  getInvertedIds(): string[];
  getInverted(): ISceneItemApi[];
  getBoundingRect(): IRectangle;
  getLastSelected(): ISceneItemApi;
  getSize(): number;
  isSelected(item: string | ISceneItem): void;
  copyTo(sceneId: string): ISceneItem[];
  copyReferenceTo(sceneId: string): ISceneItem[];
  moveTo(sceneId: string): ISceneItem[];
}

export interface ISelectionState {
  selectedIds: string[];
  lastSelectedId: string;
}


/**
 * list of ISceneItem.sceneItemId or ISceneItem
 */
export type TItemsList = string | string[] | ISceneItem | ISceneItem[];