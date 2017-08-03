import { Node } from './node';
import { SourcesNode } from './sources';
import { ScenesNode } from './scenes';
import { TransitionNode } from './transition';
import { ObsTransition, ObsGlobal } from '../../obs-api';

interface ISchema {
  sources: SourcesNode;
  scenes: ScenesNode;
  transition: TransitionNode;
}

// This is the root node of the config file
export class RootNode extends Node<ISchema, {}> {

  schemaVersion = 1;

  save() {
    const sources = new SourcesNode();
    sources.save({});

    const scenes = new ScenesNode();
    scenes.save({});

    const transition = new TransitionNode();
    transition.save();

    this.data = {
      sources,
      scenes,
      transition
    };
  }

  load() {
    this.data.sources.load({});
    this.data.scenes.load({});
    this.data.transition.load();
  }

}
