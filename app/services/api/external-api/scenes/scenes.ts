import { Observable, Subject } from 'rxjs';
import { Singleton, Fallback, InjectFromExternalApi } from 'services/api/external-api';
import {
  ScenesService as InternalScenesService,
  ISceneItem as IInternalSceneItemModel,
  IScene as IInternalSceneModel,
} from 'services/scenes/index';
import { ISourceAddOptions, SourcesService } from 'services/api/external-api/sources/sources';
import { Inject } from 'services/core/injector';
import { ISceneModel, Scene } from './scene';
import { getExternalSceneItemModel, ISceneItemModel } from './scene-item';
import { Expensive } from 'services/api/external-api-limits';
import { EditorService } from '../../../editor';
import { map } from 'rxjs/operators';

/**
 * Api for scenes management
 */
@Singleton()
export class ScenesService {
  @Fallback()
  @Inject()
  private scenesService: InternalScenesService;

  @Inject() editorService: EditorService;
  @InjectFromExternalApi() sourcesService: SourcesService;

  private convertToExternalSceneItemModel(
    internalItemModel: IInternalSceneItemModel,
  ): ISceneItemModel {
    const source = this.sourcesService.getSource(internalItemModel.sourceId);
    const name = source ? source.name : '';
    return getExternalSceneItemModel(internalItemModel, name);
  }

  private convertToExternalSceneModel(internalSceneModel: IInternalSceneModel): ISceneModel {
    const scene = this.getScene(internalSceneModel.id);
    if (scene) {
      return scene.getModel();
    } else {
      // if the scene not found it's than this model is a result of "sceneRemoved" event
      return {
        id: internalSceneModel.id,
        name: internalSceneModel.name,
        nodes: [],
      };
    }
  }

  // convert internal models from events to external models
  itemUpdated = this.scenesService.itemUpdated.pipe(
    map(m => this.convertToExternalSceneItemModel(m)),
  );
  itemRemoved = this.scenesService.itemRemoved.pipe(
    map(m => this.convertToExternalSceneItemModel(m)),
  );
  itemAdded = this.scenesService.itemAdded.pipe(map(m => this.convertToExternalSceneItemModel(m)));
  sceneAdded = this.scenesService.sceneAdded.pipe(map(m => this.convertToExternalSceneModel(m)));
  sceneRemoved = this.scenesService.sceneRemoved.pipe(
    map(m => this.convertToExternalSceneModel(m)),
  );
  sceneSwitched = this.scenesService.sceneSwitched.pipe(
    map(m => this.convertToExternalSceneModel(m)),
  );

  getScene(id: string): Scene {
    if (!this.scenesService.state.scenes[id]) return null;
    return new Scene(id);
  }

  @Expensive(
    1,
    'if you need to fetch only the list of scene names then use the getSceneNames() method',
  )
  getScenes(): Scene[] {
    return this.scenesService.views.scenes.map(scene => this.getScene(scene.id));
  }

  getSceneNames() {
    return this.scenesService.views.scenes.map(scene => scene.name);
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
    return this.scenesService.views.activeSceneId;
  }
}

export interface ISceneNodeAddOptions {
  id?: string; // A new ID will be assigned if one is not provided
  sourceAddOptions?: ISourceAddOptions;
}
