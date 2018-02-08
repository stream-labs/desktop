import { Node } from './node';
import { Scene } from '../../scenes/scene';
import { HotkeysNode } from './hotkeys';
import { SourcesService } from '../../sources';
import { ScenesService } from '../../scenes';
import { Inject } from '../../../util/injector';

interface ISchema {
  items: ISceneItemInfo[];
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
  hotkeys?: HotkeysNode;
  locked?: boolean;
  rotation?: number;
}

interface IContext {
  scene: Scene;
}

export class SceneItemsNode extends Node<ISchema, {}> {

  schemaVersion = 1;

  @Inject('SourcesService')
  sourcesService: SourcesService;

  @Inject('ScenesService')
  scenesService: ScenesService;

  getItems(context: IContext) {
    return context.scene.getItems().slice().reverse();
  }

  save(context: IContext): Promise<void> {
    const promises: Promise<ISceneItemInfo>[] = this.getItems(context).map(sceneItem => {
      return new Promise(resolve => {
        const hotkeys = new HotkeysNode();
        hotkeys.save({ sceneItemId: sceneItem.sceneItemId }).then(() => {
          const transform = sceneItem.transform;
          resolve({
            id: sceneItem.sceneItemId,
            sourceId: sceneItem.sourceId,
            x: transform.position.x,
            y: transform.position.y,
            scaleX: transform.scale.x,
            scaleY: transform.scale.y,
            visible: sceneItem.visible,
            crop: transform.crop,
            locked: sceneItem.locked,
            hotkeys,
            rotation: transform.rotation
          });
        });
      });
    });

    return new Promise(resolve => {
      Promise.all(promises).then(items => {
        this.data = { items };
        resolve();
      });
    });
  }

  /**
   * Do some data sanitizing
   */
  sanitizeIds() {
    // Look for duplicate ids
    const ids: Dictionary<boolean> = {};

    this.data.items = this.data.items.filter(item => {
      if (ids[item.id]) return false;

      ids[item.id] = true;
      return true;
    });
  }

  load(context: IContext): Promise<void> {
    context.scene.addSources(this.data.items);

    const promises: Promise<void>[] = [];

    this.data.items.forEach(item => {
      if (item.hotkeys) promises.push(item.hotkeys.load({ sceneItemId: item.id }));
    });

    return new Promise(resolve => {
      Promise.all(promises).then(() => resolve());
    });
  }

}
