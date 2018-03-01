import { Observable } from 'rxjs/Observable';
import { ISourceApi, TSourceType, ISource } from 'services/sources';
import { ISelection, TNodesList } from 'services/selection';

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
  suggestName(name: string): string;
  sceneSwitched: Observable<IScene>;
  sceneAdded: Observable<IScene>;
  sceneRemoved: Observable<IScene>;
  itemAdded: Observable<ISceneItem>;
  itemRemoved: Observable<ISceneItem>;
  itemUpdated: Observable<ISceneItem>;
}

export type TSceneNodeModel = ISceneItem | ISceneFolder;
export type TSceneNodeApi = ISceneItemApi | ISceneFolderApi;

export interface IScene {
  id: string;
  name: string;
  nodes: (ISceneItem | ISceneFolder)[];
}


export interface ISceneApi extends IScene {
  getNode(sceneNodeId: string): ISceneItemApi | ISceneFolderApi;
  getItem(sceneItemId: string): ISceneItemApi;
  getFolder(sceneFolderId: string): ISceneFolderApi;
  getNodes(): (ISceneItemApi | ISceneFolderApi)[];
  getItems(): ISceneItemApi[];
  getFolders(): ISceneFolderApi[];
  addSource(sourceId: string, options?: ISceneNodeAddOptions): ISceneItemApi;
  createAndAddSource(name: string, type: TSourceType): ISceneItemApi;
  createFolder(name: string): ISceneFolderApi;
  removeFolder(folderId: string): void;
  removeItem(sceneItemId: string): void;
  remove(): void;
  canAddSource(sourceId: string): boolean;
  setName(newName: string): void;
  getModel(): IScene;
  makeActive(): void;
  getSelection(itemsList: TNodesList): ISelection;
}


export interface ISceneNodeAddOptions {
  id?: string; // A new ID will be assigned if one is not provided
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


export interface ISceneItem extends ISceneItemSettings, ISceneNode {
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
  getSource(): ISourceApi;
  getModel(): ISceneItem & ISource;
  select(): void;
}

export type TSceneNodeType = 'item' | 'folder';

export interface ISceneNode {
  id: string;
  sceneNodeType: TSceneNodeType;
  parentId?: string;
  childrenIds?: string[];
}

export interface ISceneNodeApi extends ISceneNode {
  getScene(): ISceneApi;
  getSelection(): ISelection;
  getParent(): ISceneFolder;
}

export interface ISceneFolder extends ISceneNode {
  name: string;
}

export interface ISceneFolderApi extends ISceneFolder {
  getScene(): ISceneApi;
  getSelection(): ISelection;
  getParent(): ISceneFolder;
  getItems(): ISceneItemApi[];
  setName(newName: string): void;
  select(): void;
}
