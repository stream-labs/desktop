import { Node } from './node';
import { Inject } from 'services/core';
import { SceneCollectionsService } from 'services/scene-collections';

interface ISceneNodeMapSchema {}

interface ISchema {
  // sceneNodeMaps: { [collectionId: string]: { [sceneId: string]: Dictionary<string> } };

  sceneNodeMaps: { [sceneId: string]: Dictionary<string> };
}

export class NodeMapNode extends Node<ISchema, {}> {
  schemaVersion = 1;

  @Inject() sceneCollectionsService: SceneCollectionsService;

  async save() {
    console.log('save node map before ', this.data);
    const activeCollection = this.sceneCollectionsService.activeCollection;
    if (activeCollection?.sceneNodeMaps) {
      this.data = {
        sceneNodeMaps: this.sceneCollectionsService?.sceneNodeMaps,
      };
      // const collectionId = this.sceneCollectionsService;
      // this.data.sceneNodeMaps = {
      //   ...this.data.sceneNodeMaps,
      //   [activeCollection.id]: activeCollection.sceneNodeMaps,
      // };
      console.log('after ', this.data);
    }
  }

  async load() {
    console.log('load func ', this.data.sceneNodeMaps);
    if (this.data.sceneNodeMaps && !this.sceneCollectionsService.hasOwnProperty('sceneNodeMaps')) {
      console.log('load func node map');

      this.sceneCollectionsService.initNodeMaps(this.data.sceneNodeMaps);
    }
    // const activeCollection = this.sceneCollectionsService.activeCollection;
    // if (
    //   this.data.sceneNodeMaps &&
    //   this.data.sceneNodeMaps.hasOwnProperty(activeCollection.id) &&
    //   !this.sceneCollectionsService.hasOwnProperty('sceneNodeMaps')
    // ) {
    //   console.log('load func node map');

    //   this.sceneCollectionsService.initNodeMaps(this.data.sceneNodeMaps[activeCollection.id]);
    // }
  }
}
