import { Node } from '../node';
import { ScenesNode } from './scenes';
import { TransitionNode } from './transition';

interface ISchema {
  scenes: ScenesNode;
  transition?: TransitionNode;
}

interface IContext {
  assetsPath: string;
}

export class RootNode extends Node<ISchema, IContext> {
  schemaVersion = 1;

  savedAssets: Dictionary<string> = {};

  async save(context: IContext): Promise<void> {
    const scenes = new ScenesNode();
    await scenes.save({ ...context, savedAssets: this.savedAssets });

    const transition = new TransitionNode();
    await transition.save(context);

    this.data = { scenes, transition };
  }

  async load(context: IContext): Promise<void> {
    if (this.data.transition) await this.data.transition.load(context);
    await this.data.scenes.load({ ...context, savedAssets: this.savedAssets });
  }
}
