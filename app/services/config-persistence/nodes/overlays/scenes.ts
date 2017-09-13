import { ArrayNode } from '../array-node';
import { ScenesService, Scene } from '../../../scenes';
import { SlotsNode } from './slots';

interface ISchema {
  name: string;
  slots: SlotsNode;
}

interface IContext {
  assetsPath: string;
}

export class ScenesNode extends ArrayNode<ISchema, IContext, Scene> {

  schemaVersion = 1;

  scenesService: ScenesService = ScenesService.instance;


  getItems() {
    return this.scenesService.scenes;
  }


  saveItem(scene: Scene, context: IContext): Promise<ISchema> {
    return new Promise(resolve => {
      const slots = new SlotsNode();
      slots.save({ scene, assetsPath: context.assetsPath }).then(() => {
        resolve({
          name: scene.name,
          slots
        });
      });
    });
  }


  loadItem(obj: ISchema, context: IContext): Promise<void> {
    return new Promise(resolve => {
      const scene = this.scenesService.createScene(obj.name, { makeActive: true });
      obj.slots.load({ scene, assetsPath: context.assetsPath }).then(() => {
        resolve();
      });
    });
  }

}
