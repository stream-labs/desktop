import { ArrayNode } from '../array-node';
import { ScenesService, Scene } from '../../../scenes';
import { IFolderSchema, SlotsNode, TSlotSchema } from './slots';

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

  async saveItem(scene: Scene, context: IContext): Promise<ISchema> {
    const slots = new SlotsNode();
    await slots.save({ scene, assetsPath: context.assetsPath });

    return {
      name: scene.name,
      slots
    };
  }

  async loadItem(obj: ISchema, context: IContext): Promise<void> {
    const scene = this.scenesService.createScene(obj.name, {
      makeActive: true
    });
    await obj.slots.load({ scene, assetsPath: context.assetsPath });

    // append children to folders
    const foldersSchemas = (obj.slots.data.items as TSlotSchema[])
      .filter(item => item.sceneNodeType === 'folder')
      .reverse();

    const folders = scene.getFolders();
    folders.forEach((folder, ind) => {
      const childrenIds = (foldersSchemas[ind] as IFolderSchema).childrenIds;
      scene.getSelection(childrenIds).moveTo(scene.id, folder.id);
    });
  }
}
