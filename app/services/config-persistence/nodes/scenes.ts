import { ArrayNode } from './array-node';
import { SceneItemsNode } from './scene-items';
import { ScenesService, Scene } from '../../scenes';
import { HotkeysNode } from './hotkeys';

interface ISchema {
  id: string;
  name: string;
  sceneItems: SceneItemsNode;
  active: boolean;
  hotkeys?: HotkeysNode;
}

export class ScenesNode extends ArrayNode<ISchema, {}, Scene> {

  schemaVersion = 1;

  scenesService: ScenesService = ScenesService.instance;

  getItems() {
    return this.scenesService.scenes;
  }

  saveItem(scene: Scene): ISchema {
    const sceneItems = new SceneItemsNode();
    sceneItems.save({ scene });

    const hotkeys = new HotkeysNode();
    hotkeys.save({ sceneId: scene.id });

    return {
      id: scene.id,
      name: scene.name,
      sceneItems,
      hotkeys,
      active: this.scenesService.activeSceneId === scene.id
    };
  }

  loadItem(obj: ISchema) {
    const scene = this.scenesService.createScene(
      obj.name,
      { sceneId: obj.id }
    );

    obj.sceneItems.load({ scene });

    if (obj.active) this.scenesService.makeSceneActive(scene.id);
    if (obj.hotkeys) obj.hotkeys.load({ sceneId: scene.id });
  }

}
