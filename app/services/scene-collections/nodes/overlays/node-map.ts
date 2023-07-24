import { Node } from '../node';
import { Inject } from 'services/core';
import { SceneCollectionsService } from 'services/scene-collections';

interface ISceneNodeMapSchema {
  sceneNodeMaps: { [sceneId: string]: Dictionary<string> };
}

export class NodeMapNode extends Node<ISceneNodeMapSchema, {}> {
  schemaVersion = 1;

  @Inject() sceneCollectionsService: SceneCollectionsService;

  async save() {
    if (this.sceneCollectionsService.activeCollection.hasOwnProperty('sceneNodeMaps')) {
      this.data.sceneNodeMaps = this.sceneCollectionsService.activeCollection.sceneNodeMaps;
    }
  }

  async load() {
    if (this.data?.sceneNodeMaps) {
      this.sceneCollectionsService.initNodeMaps(this.data?.sceneNodeMaps);
    }
  }
}
