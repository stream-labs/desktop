import {
  apiEvent,
  apiMethod,
  EApiPermissions,
  IApiContext,
  Module,
  NotImplementedError,
} from './module';
import { Scene, ScenesService, TSceneNode } from 'services/scenes';
import { Inject } from 'util/injector';
import { Subject } from 'rxjs';

enum ESceneNodeType {
  Folder = 'folder',
  SceneItem = 'scene_item',
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
    this.scenesService.sceneAdded.subscribe(sceneData => {
      const scene = this.scenesService.getScene(sceneData.id);
      this.sceneAdded.next(this.serializeScene(scene));
    });
    this.scenesService.sceneSwitched.subscribe(sceneData => {
      const scene = this.scenesService.getScene(sceneData.id);
      this.sceneSwitched.next(this.serializeScene(scene));
    });
    this.scenesService.sceneRemoved.subscribe(sceneData => {
      this.sceneRemoved.next(sceneData.id);
    });
  }

  @apiEvent()
  sceneAdded = new Subject<IScene>();

  @apiEvent()
  sceneSwitched = new Subject<IScene>();

  @apiEvent()
  sceneRemoved = new Subject<string>();

  // TODO Events for scene items

  @apiMethod()
  getScenes() {
    return this.scenesService.getScenes().map(scene => this.serializeScene(scene));
  }

  @apiMethod()
  getScene(_ctx: IApiContext, id: string): IScene | null {
    const scene = this.scenesService.getScene(id);

    return scene ? this.serializeScene(scene) : null;
  }

  @apiMethod()
  getSceneItem(_ctx: IApiContext, id: string): ISceneItem | ISceneItemFolder | null {
    const sceneItem = this.scenesService.getSceneItem(id);

    return sceneItem ? this.serializeNode(sceneItem) : null;
  }

  @apiMethod()
  getActiveScene() {
    return this.serializeScene(this.scenesService.activeScene);
  }

  @apiMethod()
  createScene() {
    throw new NotImplementedError();
  }

  @apiMethod()
  updateScene(ctx: IApiContext, patch: Partial<IScene>) {
    this.validatePatch(['id'], patch);

    if (patch.name) this.scenesService.getScene(patch.id).setName(patch.name);
  }

  @apiMethod()
  removeScene() {
    throw new NotImplementedError();
  }

  @apiMethod()
  makeSceneActive(ctx: IApiContext, id: string) {
    this.scenesService.makeSceneActive(id);
  }

  @apiMethod()
  createSceneItem(ctx: IApiContext, sceneId: string, sourceId: string) {
    const scene = this.scenesService.getScene(sceneId);
    if (!scene) throw new Error(`Scene ${sceneId} does not exist!`);

    const sceneItem = scene.addSource(sourceId);
    return this.serializeNode(sceneItem);
  }

  @apiMethod()
  updateSceneItem(ctx: IApiContext, patch: Partial<ISceneItem>) {
    this.validatePatch(['id'], patch);
    const sceneItem = this.scenesService.getSceneItem(patch.id);

    if (patch.locked != null) sceneItem.setLocked(patch.locked);
    if (patch.visible != null) sceneItem.setVisibility(patch.visible);
    if (patch.transform != null) sceneItem.setTransform(patch.transform);
  }

  @apiMethod()
  removeSceneItem(ctx: IApiContext, sceneId: string, sceneItemId: string) {
    const scene = this.scenesService.getScene(sceneId);
    if (!scene) throw new Error(`Scene ${sceneId} does not exist!`);

    scene.removeItem(sceneItemId);
  }

  private serializeScene(scene: Scene): IScene {
    return {
      id: scene.id,
      name: scene.name,
      nodes: scene.getNodes().map(node => {
        return this.serializeNode(node);
      }),
    };
  }

  private serializeNode(node: TSceneNode) {
    if (node.isFolder()) {
      return {
        id: node.id,
        type: ESceneNodeType.Folder,
        name: node.name,
        childrenIds: node.childrenIds,
      } as ISceneItemFolder;
      // tslint:disable-next-line:no-else-after-return TODO
    } else if (node.isItem()) {
      return {
        id: node.id,
        type: ESceneNodeType.SceneItem,
        sourceId: node.sourceId,
        visible: node.visible,
        locked: node.locked,
        transform: node.transform,
      } as ISceneItem;
    }
  }
}
