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

  async save(context: IContext): Promise<void> {
    const scenes = new ScenesNode();
    await scenes.save(context);
    this.data = { scenes };
  }

  async load(context: IContext): Promise<void> {
    await this.data.scenes.load(context);
  }
}
