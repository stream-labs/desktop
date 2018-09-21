import { Module, apiMethod, EApiPermissions } from './module';
import { SceneCollectionsService } from 'services/scene-collections';
import { Inject } from 'util/injector';

export interface ISceneCollectionSchema {
  name: string;
  id: string;

  scenes: {
    id: string;
    name: string;
    sceneItems: { sceneItemId: string, sourceId: string }[]
  }[];

  sources: {
    sourceId: string;
    name: string;
    type: string;
    channel: number;
  }[];
}

export class SceneCollectionsModule extends Module {

  moduleName = 'SceneCollections';
  permissions = [EApiPermissions.SceneCollections];

  @Inject() sceneCollectionsService: SceneCollectionsService;

  @apiMethod()
  getSceneCollectionsSchema(): Promise<ISceneCollectionSchema[]> {
    return this.sceneCollectionsService.fetchSceneCollectionsSchema();
  }

}
