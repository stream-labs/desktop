import { Observable } from 'rxjs';
import { Singleton } from '../../external-api';
import { ScenesService as InternalScenesService } from 'services/scenes/index';
import { ISourceAddOptions } from '../sources/sources';
import { Inject } from '../../../../util/injector';
import { IScene, Scene } from './scene';
import { ISceneItem } from './scene-item';

/**
 * Api for scenes management
 */
@Singleton()
export class ScenesService {
  @Inject() private scenesService: InternalScenesService;

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

  removeScene(id: string): IScene {
    const model = this.getScene(id).getModel();
    this.scenesService.removeScene(id);
    return model;
  }

  makeSceneActive(id: string): void {
    this.scenesService.makeSceneActive(id);
  }

  get activeScene(): Scene {
    return this.getScene(this.activeSceneId);
  }

  get activeSceneId(): string {
    return this.scenesService.activeSceneId;
  }

  get sceneSwitched(): Observable<IScene> {
    return this.scenesService.sceneSwitched;
  }

  get sceneAdded(): Observable<IScene> {
    return this.scenesService.sceneAdded;
  }

  get sceneRemoved(): Observable<IScene> {
    return this.scenesService.sceneRemoved;
  }

  get itemAdded(): Observable<ISceneItem> {
    return this.scenesService.itemAdded;
  }

  get itemRemoved(): Observable<ISceneItem> {
    return this.scenesService.itemAdded;
  }

  get itemUpdated(): Observable<ISceneItem> {
    return this.scenesService.itemAdded;
  }
}

export interface ISceneNodeAddOptions {
  id?: string; // A new ID will be assigned if one is not provided
  sourceAddOptions?: ISourceAddOptions;
}
