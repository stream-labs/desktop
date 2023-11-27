import { Node } from './node';
import { Inject } from 'services/core';
import { SceneCollectionsService } from 'services/scene-collections';

interface ISchema {
  sceneNodeMaps: { [sceneId: string]: Dictionary<string> };
}

export class NodeMapNode extends Node<ISchema, {}> {
  schemaVersion = 1;

  @Inject() sceneCollectionsService: SceneCollectionsService;

  async save() {
    const activeCollection = this.sceneCollectionsService.activeCollection;
    if (activeCollection?.sceneNodeMaps) {
      this.data = {
        sceneNodeMaps: this.sceneCollectionsService?.sceneNodeMaps,
      };
    }
  }

  async load() {
    if (this.data?.sceneNodeMaps) {
      this.sceneCollectionsService.initNodeMaps(this.data.sceneNodeMaps);
    }
  }
}
