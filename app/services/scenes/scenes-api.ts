import { Observable } from 'rxjs/Observable';
import { ISourceApi, TSourceType, ISource } from '../sources';

/**
 * Api for scenes management
 */
export interface IScenesServiceApi {
  createScene(name: string, options?: ISceneCreateOptions): ISceneApi;
  makeSceneActive(id: string): boolean;
  removeScene(id: string): IScene;
  scenes: ISceneApi[];
  activeScene: ISceneApi;
  activeSceneId: string;
  getSceneByName(name: string): ISceneApi;
  getScenes(): ISceneApi[];
  getModel(): IScenesState;
  sceneSwitched: Observable<IScene>;
  sceneAdded: Observable<IScene>;
  sceneRemoved: Observable<IScene>;
  itemAdded: Observable<ISceneItem>;
  itemRemoved: Observable<ISceneItem>;
  itemUpdated: Observable<ISceneItem>;
}


export interface IScene {
  id: string;
  name: string;
  items: ISceneItem[];
}


export interface ISceneApi extends IScene {
  getItem(sceneItemId: string): ISceneItemApi;
  getItems(): ISceneItemApi[];
  addSource(sourceId: string, options?: ISceneItemAddOptions): ISceneItemApi;
  createAndAddSource(name: string, type: TSourceType): ISceneItemApi;
  removeItem(sceneItemId: string): void;
  remove(): void;
  canAddSource(sourceId: string): boolean;
  setName(newName: string): void;
  getModel(): IScene;
}


export interface ISceneItemAddOptions {
  sceneItemId?: string; // A new ID will be assigned if one is not provided
}


export interface ISceneItemInfo {
  id: string;
  sourceId: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  crop: ICrop;
  locked?: boolean;
  rotation?: number;
}


export interface IScenesState {
  activeSceneId: string;
  displayOrder: string[];
  scenes: Dictionary<IScene>;
}


export interface ISceneCreateOptions {
  duplicateSourcesFromScene?: string;
  sceneId?: string; // A new ID will be generated if one is not provided
  makeActive?: boolean;
}

export interface ISceneItemSettings {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  crop: ICrop;
  locked: boolean;
  rotation: number;
}

export interface ISceneItem extends ISceneItemSettings {
  sceneItemId: string;
  sourceId: string;
  obsSceneItemId: number;
}

export interface ISceneItemActions {
  setVisibility(visible: boolean): void;
  setLocked(locked: boolean): void;
  resetTransform(): void;
  flipX(): void;
  flipY(): void;
  stretchToScreen(): void;
  fitToScreen(): void;
  centerOnScreen(): void;
  rotate(deg: number): void;
  remove(): void;
}

export interface ISceneItemApi extends ISceneItem, ISceneItemActions {
  getScene(): ISceneApi;
  getSource(): ISourceApi;
  getModel(): ISceneItem & ISource;

  setPosition(vec: IVec2): void;
  setPositionAndScale(x: number, y: number, scaleX: number, scaleY: number): void;
  setCrop(crop: ICrop): ICrop;
  setPositionAndCrop(x: number, y: number, crop: ICrop): void;
}
