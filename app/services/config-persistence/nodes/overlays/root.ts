import { Node } from '../node';
import { ScenesNode } from './scenes';

interface ISchema {
  scenes: ScenesNode;
}

interface IContext {
  assetsPath: string;
}

export class RootNode extends Node<ISchema, IContext> {

  schemaVersion = 1;

  save(context: IContext) {
    const scenes = new ScenesNode();
    scenes.save(context);

    this.data = {
      scenes
    };
  }

  load(context: IContext) {
    this.data.scenes.load(context);
  }

}
