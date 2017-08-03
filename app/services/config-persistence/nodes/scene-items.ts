import { ArrayNode } from './array-node';
import { SceneItem } from '../../scenes/scene-item';
import { Scene } from '../../scenes/scene';

interface ISchema {
  id: string;
  sourceId: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  crop: ICrop;
}

interface IContext {
  scene: Scene;
}

export class SceneItemsNode extends ArrayNode<ISchema, IContext, SceneItem> {

  schemaVersion = 1;

  getItems(context: IContext) {
    return context.scene.getItems({ showHidden: true }).slice().reverse();
  }

  saveItem(sceneItem: SceneItem): ISchema {
    return {
      id: sceneItem.sceneItemId,
      sourceId: sceneItem.sourceId,
      x: sceneItem.x,
      y: sceneItem.y,
      scaleX: sceneItem.scaleX,
      scaleY: sceneItem.scaleY,
      visible: sceneItem.visible,
      crop: sceneItem.crop
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
  }

}
