import { Observable } from 'rxjs/Observable';
import { ISourceApi, TSourceType, ISource } from 'services/sources';
import { ISelection, TItemsList } from 'services/selection';

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
  makeActive(): void;
  getSelection(itemsList: TItemsList): ISelection;
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

export interface ITransform {
  position: IVec2;
  scale: IVec2;
  crop: ICrop;
  rotation: number;
}

export interface IPartialTransform {
  position?: Partial<IVec2>;
  scale?: Partial<IVec2>;
  crop?: Partial<ICrop>;
  rotation?: number;
}

export interface ISceneItemSettings {
  transform: ITransform;
  visible: boolean;
  locked: boolean;
}

export interface IPartialSettings {
  transform?: IPartialTransform;
  visible?: boolean;
  locked?: boolean;
}


export interface ISceneItem extends ISceneItemSettings {
  sceneItemId: string;
  sourceId: string;
  obsSceneItemId: number;
}

export interface ISceneItemActions {
  setSettings(settings: Partial<ISceneItemSettings>): void;
  setVisibility(visible: boolean): void;
  setTransform(transform: IPartialTransform): void;
  resetTransform(): void;
  flipX(): void;
  flipY(): void;
  stretchToScreen(): void;
  fitToScreen(): void;
  centerOnScreen(): void;
  rotate(deg: number): void;
  remove(): void;

  /**
   * only for scene sources
   */
  setContentCrop(): void;
}

export interface ISceneItemApi extends ISceneItem, ISceneItemActions {
  getScene(): ISceneApi;
  getSource(): ISourceApi;
  getModel(): ISceneItem & ISource;
}
