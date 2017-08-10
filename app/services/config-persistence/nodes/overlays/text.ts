import { Node } from '../node';
import { SceneItem } from '../../../scenes';

interface ISchema {
  settings: object;
}

interface IContext {
  sceneItem: SceneItem;
  assetsPath: string;
}

export class TextNode extends Node<ISchema, IContext> {

  schemaVersion = 1;


  save(context: IContext) {
    this.data = {
      settings: context.sceneItem.getObsInput().settings
    };
  }


  load(context: IContext) {
    // TODO: Install google fonts that aren't installed
    // on this system.

    context.sceneItem.getObsInput().update(this.data.settings);
  }

}
