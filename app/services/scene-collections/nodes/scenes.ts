import { ArrayNode } from './array-node';
import { SceneItemsNode } from './scene-items';
import { ScenesService, Scene, TSceneType } from '../../scenes';
import { SourcesService } from '../../sources';
import { HotkeysNode } from './hotkeys';
import { SceneFiltersNode } from './scene-filters';

export interface ISceneSchema {
  id: string;
  name: string;
  sceneItems: SceneItemsNode;
  active: boolean;
  hotkeys?: HotkeysNode;
  filters?: SceneFiltersNode;
  sceneType?: TSceneType;
  dualOutputSceneSourceId?: string;
}

export class ScenesNode extends ArrayNode<ISceneSchema, {}, Scene> {
  schemaVersion = 1;

  scenesService: ScenesService = ScenesService.instance;
  sourcesService: SourcesService = SourcesService.instance;

  getItems() {
    return this.scenesService.views.scenes;
  }

  saveItem(scene: Scene): Promise<ISceneSchema> {
    return new Promise(resolve => {
      const sceneItems = new SceneItemsNode();
      const hotkeys = new HotkeysNode();
      const filters = new SceneFiltersNode();

      sceneItems
        .save({ scene })
        .then(() => {
          return hotkeys.save({ sceneId: scene.id });
        })
        .then(() => {
          return filters.save({ sceneId: scene.id });
        })
        .then(() => {
          resolve({
            hotkeys,
            filters,
            sceneItems,
            id: scene.id,
            name: scene.name,
            active: this.scenesService.views.activeSceneId === scene.id,
            sceneType: scene?.sceneType,
            dualOutputSceneSourceId: scene?.dualOutputSceneSourceId,
          });
        });
    });
  }

  /**
   * Do some data sanitizing
   */
  async beforeLoad() {
    // Look for duplicate ids
    const ids: Dictionary<boolean> = {};

    this.data.items = this.data.items.filter(item => {
      if (ids[item.id]) return false;

      ids[item.id] = true;
      return true;
    });
  }

  loadItem(obj: ISceneSchema): Promise<() => Promise<void>> {
    return new Promise(resolve => {
      const scene = this.scenesService.createScene(obj.name, {
        sceneId: obj.id,
        sceneType: obj?.sceneType ?? 'scene',
        dualOutputSceneSourceId: obj?.dualOutputSceneSourceId,
      });

      if (obj.filters) obj.filters.load({ sceneId: scene.id });

      resolve(() => {
        return new Promise(resolve => {
          obj.sceneItems.load({ scene }).then(() => {
            if (obj.active) this.scenesService.makeSceneActive(scene.id);

            if (obj.hotkeys) {
              obj.hotkeys.load({ sceneId: scene.id }).then(() => resolve());
            } else {
              resolve();
            }
          });
        });
      });
    });
  }

  async afterLoad() {
    // Make sure we actually have an active scene (an invalid state things something get in)
    if (!this.scenesService.views.activeSceneId) {
      this.scenesService.makeSceneActive(this.scenesService.views.scenes[0].id);
    }
  }
}
