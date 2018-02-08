import { ISceneItemActions, ISceneItemApi, ISceneItem } from 'services/scenes';

export interface ISelectionServiceApi extends ISceneItemActions {
  add(itemIds: string | string[]): void;
  select(itemIds: string | string[]): void;
  deselect(itemIds: string | string[]): void;
  reset(): void;
  selectAll(): void;
  getItems(): ISceneItemApi[];
  getIds(): string[];
  getInvertedIds(): string[];
  getInverted(): ISceneItemApi[];
  invert(): ISceneItemApi[];
  getLastSelected(): ISceneItemApi;
  getSize(): number;
  isSelected(item: string | ISceneItem): void;
}
