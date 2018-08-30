import { Module, EApiPermissions, apiMethod, apiEvent } from './module';
import { ScenesService } from 'services/scenes';
import { Inject } from 'util/injector';

enum ESceneNodeType {
  Folder = 'folder',
  SceneItem = 'scene_item'
}

interface INode {
  type: ESceneNodeType;
}

interface ISceneItem extends INode {
  type: ESceneNodeType.SceneItem;
}

interface ISceneItemFolder extends INode {
  type: ESceneNodeType.Folder;
}

interface IScene {
  id: string;
  name: string;
  nodes: INode;
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
    return this.scenesService.getScenes();
  }

}
