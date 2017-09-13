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

  save(): Promise<void> {
    const sources = new SourcesNode();
    const scenes = new ScenesNode();
    const transition = new TransitionNode();
    const hotkeys = new HotkeysNode();

    return new Promise(resolve => {
      sources.save({}).then(() => {
        return scenes.save({});
      }).then(() => {
        return transition.save();
      }).then(() => {
        return hotkeys.save({});
      }).then(() => {
        this.data = {
          sources,
          scenes,
          transition,
          hotkeys
        };

        resolve();
      });
    });
  }

  load(): Promise<void> {
    return new Promise(resolve => {
      this.data.sources.load({}).then(() => {
        return this.data.scenes.load({});
      }).then(() => {
        return this.data.transition.load();
      }).then(() => {
        if (this.data.hotkeys) {
          return this.data.hotkeys.load({});
        } else {
          return Promise.resolve();
        }
      }).then(() => {
        resolve();
      });
    });
  }

}
