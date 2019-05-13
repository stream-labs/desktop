import { Observable } from 'rxjs';
import { Singleton, Fallback } from 'services/api/external-api';
import { ScenesService as InternalScenesService } from 'services/scenes/index';
import { ISourceAddOptions } from 'services/api/external-api/sources/sources';
import { Inject } from 'services/core/injector';
import { ISceneModel, Scene } from './scene';
import { ISceneItemModel } from './scene-item';

/**
 * Api for scenes management
 */
@Singleton()
export class ScenesService {
  @Fallback()
  @Inject()
  private scenesService: InternalScenesService;

  getScene(id: string): Scene {
    return new Scene(id);
  }

  getScenes(): Scene[] {
    return this.scenesService.getScenes().map(scene => this.getScene(scene.id));
  }

  createScene(name: string): Scene {
    const scene = this.scenesService.createScene(name);
    return this.getScene(scene.id);
  }

  removeScene(id: string): ISceneModel {
    const model = this.getScene(id).getModel();
    this.scenesService.removeScene(id);
    return model;
  }

  makeSceneActive(id: string): boolean {
    return this.scenesService.makeSceneActive(id);
  }

  get activeScene(): Scene {
    return this.getScene(this.activeSceneId);
  }

  get activeSceneId(): string {
    return this.scenesService.activeSceneId;
  }

  get sceneSwitched(): Observable<ISceneModel> {
    return this.scenesService.sceneSwitched;
  }

  get sceneAdded(): Observable<ISceneModel> {
    return this.scenesService.sceneAdded;
  }

  get sceneRemoved(): Observable<ISceneModel> {
    return this.scenesService.sceneRemoved;
  }

  get itemAdded(): Observable<ISceneItemModel> {
    return this.scenesService.itemAdded;
  }

  get itemRemoved(): Observable<ISceneItemModel> {
    return this.scenesService.itemRemoved;
  }

  get itemUpdated(): Observable<ISceneItemModel> {
    return this.scenesService.itemUpdated;
  }
}

export interface ISceneNodeAddOptions {
  id?: string; // A new ID will be assigned if one is not provided
  sourceAddOptions?: ISourceAddOptions;
}
