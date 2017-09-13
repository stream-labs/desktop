import { ArrayNode } from './array-node';
import { SceneItemsNode } from './scene-items';
import { ScenesService, Scene } from '../../scenes';
import { SourcesService, Source, TSourceType } from '../../sources';
import { HotkeysNode } from './hotkeys';
import * as obs from '../../../../obs-api';

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
  sourcesService: SourcesService = SourcesService.instance;

  getItems() {
    return this.scenesService.scenes;
  }

  saveItem(scene: Scene): Promise<ISchema> {
    return new Promise(resolve => {
      const sceneItems = new SceneItemsNode();
      const hotkeys = new HotkeysNode();

      sceneItems.save({ scene }).then(() => {
        return hotkeys.save({ sceneId: scene.id });
      }).then(() => {
        resolve({
          id: scene.id,
          name: scene.name,
          sceneItems,
          hotkeys,
          active: this.scenesService.activeSceneId === scene.id
        });
      });
    });
  }

  loadItem(obj: ISchema): Promise<void> {
    return new Promise(resolve => {
      const scene = this.scenesService.createScene(
        obj.name,
        { sceneId: obj.id }
      );

      obj.sceneItems.load({ scene }).then(() => {
        if (obj.active) this.scenesService.makeSceneActive(scene.id);

        if (obj.hotkeys) {
          obj.hotkeys.load({ sceneId: scene.id }).then(() => resolve());
        } else {
          resolve();
        }
      });
    });
  }

}
