import { ArrayNode } from './array-node';
import { SceneItem } from '../../scenes/scene-item';
import { Scene } from '../../scenes/scene';
import { HotkeysNode } from './hotkeys';

interface ISchema {
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
}

interface IContext {
  scene: Scene;
}

export class SceneItemsNode extends ArrayNode<ISchema, IContext, SceneItem> {

  schemaVersion = 1;

  getItems(context: IContext) {
    return context.scene.getItems().slice().reverse();
  }

  saveItem(sceneItem: SceneItem): ISchema {
    const hotkeys = new HotkeysNode();
    hotkeys.save({ sceneItemId: sceneItem.sceneItemId });

    return {
      id: sceneItem.sceneItemId,
      sourceId: sceneItem.sourceId,
      x: sceneItem.x,
      y: sceneItem.y,
      scaleX: sceneItem.scaleX,
      scaleY: sceneItem.scaleY,
      visible: sceneItem.visible,
      crop: sceneItem.crop,
      locked: sceneItem.locked,
      hotkeys
    };
  }

  loadItem(obj: ISchema, context: IContext) {
    const item = context.scene.addSource(
      obj.sourceId,
      { sceneItemId: obj.id }
    );

    item.setPositionAndScale(
      obj.x,
      obj.y,
      obj.scaleX,
      obj.scaleY
    );
    item.setVisibility(obj.visible);
    item.setCrop(obj.crop);
    item.setLocked(obj.locked || false);

    if (obj.hotkeys) obj.hotkeys.load({ sceneItemId: obj.id });
  }

}
