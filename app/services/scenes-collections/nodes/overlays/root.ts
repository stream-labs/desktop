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

  save(context: IContext): Promise<void> {
    return new Promise(resolve => {
      const scenes = new ScenesNode();
      scenes.save(context).then(() => {
        this.data = {
          scenes
        };
        resolve();
      });
    });
  }

  load(context: IContext): Promise<void> {
    return new Promise(resolve => {
      this.data.scenes.load(context).then(() => resolve());
    });
  }

}
