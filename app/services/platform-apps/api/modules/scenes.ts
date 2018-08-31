import { Module, EApiPermissions, apiMethod, apiEvent, NotImplementedError } from './module';
import { ScenesService, Scene } from 'services/scenes';
import { Inject } from 'util/injector';

enum ESceneNodeType {
  Folder = 'folder',
  SceneItem = 'scene_item'
}

interface INode {
  id: string;
  type: ESceneNodeType;
}

interface ITransform {
  position: IVec2;
  scale: IVec2;
  crop: ICrop;
  rotation: number;
}

interface ISceneItem extends INode {
  type: ESceneNodeType.SceneItem;
  sourceId: string;
  visible: boolean;
  locked: boolean;
  transform: ITransform;
}

interface ISceneItemFolder extends INode {
  type: ESceneNodeType.Folder;
  name: string;
  childrenIds: string[];
}

interface IScene {
  id: string;
  name: string;
  nodes: (ISceneItem | ISceneItemFolder)[];
}

export class ScenesModule extends Module {

  moduleName = 'Scenes';
  permissions = [EApiPermissions.ScenesSources];

  @Inject() scenesService: ScenesService;

  constructor() {
    super();
    // Event subscriptions
  }

  @apiMethod()
  getScenes() {
    return this.scenesService.getScenes().map(scene => this.serializeScene(scene));
  }

  @apiMethod()
  createScene() {
    throw new NotImplementedError();
  }

  @apiMethod()
  updateScene(patch: Partial<IScene>) {
    this.validatePatch(['id'], patch);

    if (patch.name) this.scenesService.getScene(patch.id).setName(patch.name);
  }

  @apiMethod()
  removeScene() {
    throw new NotImplementedError();
  }

  @apiMethod()
  createSceneItem() {
    throw new NotImplementedError();
  }

  @apiMethod()
  updateSceneItem(patch: Partial<ISceneItem>) {
    this.validatePatch(['id'], patch);
    const sceneItem = this.scenesService.getSceneItem(patch.id);

    if (patch.locked != null) sceneItem.setLocked(patch.locked);
    if (patch.visible != null) sceneItem.setVisibility(patch.visible);
    if (patch.transform != null) sceneItem.setTransform(patch.transform);
  }

  @apiMethod()
  removeSceneItem() {
    throw new NotImplementedError();
  }

  private serializeScene(scene: Scene): IScene {
    return {
      id: scene.id,
      name: scene.name,
      nodes: scene.getNodes().map(node => {
        if (node.isFolder()) {
          const folder: ISceneItemFolder = {
            id: node.id,
            type: ESceneNodeType.Folder,
            name: node.name,
            childrenIds: node.childrenIds
          };

          return folder;
        } else if (node.isItem()) {
          const item: ISceneItem = {
            id: node.id,
            type: ESceneNodeType.SceneItem,
            sourceId: node.sourceId,
            visible: node.visible,
            locked: node.locked,
            transform: node.transform
          };

          return item;
        }
      })
    };
  }

}
