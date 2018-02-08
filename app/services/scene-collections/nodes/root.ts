import { Node } from './node';
import { SourcesNode } from './sources';
import { ScenesNode } from './scenes';
import { TransitionNode } from './transition';
import { HotkeysNode } from './hotkeys';

interface ISchema {
  sources: SourcesNode;
  scenes: ScenesNode;
  transition: TransitionNode;
  hotkeys?: HotkeysNode;
}

// This is the root node of the config file
export class RootNode extends Node<ISchema, {}> {

  schemaVersion = 1;

  async save(): Promise<void> {
    const sources = new SourcesNode();
    const scenes = new ScenesNode();
    const transition = new TransitionNode();
    const hotkeys = new HotkeysNode();

    await sources.save({});
    await scenes.save({});
    await transition.save();
    await hotkeys.save({});

    this.data = {
      sources,
      scenes,
      transition,
      hotkeys
    };
  }

  async load(): Promise<void> {
    await this.data.sources.load({});
    await this.data.scenes.load({});
    await this.data.transition.load();

    if (this.data.hotkeys) {
      await this.data.hotkeys.load({});
    }
  }
}
