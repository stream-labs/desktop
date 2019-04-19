import { ServiceHelper } from 'services/stateful-service';
import { SceneItem as InternalSceneItem } from 'services/scenes';
import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
import { ISourceModel, Source, SourcesService } from 'services/api/external-api/sources/sources';
import { ISceneNode, SceneNode } from './scene-node';

export interface ISceneItem extends ISceneItemSettings, ISceneNode {
  sceneItemId: string;
  sourceId: string;
}

export interface ISceneItemSettings {
  transform: ITransform;
  visible: boolean;
  locked: boolean;
}

interface ICrop {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ITransform {
  position: IVec2;
  scale: IVec2;
  crop: ICrop;
  rotation: number;
}

export interface IPartialTransform {
  position?: Partial<IVec2>;
  scale?: Partial<IVec2>;
  crop?: Partial<ICrop>;
  rotation?: number;
}

export interface ISceneItemActions {
  setSettings(settings: Partial<ISceneItemSettings>): void;
  setVisibility(visible: boolean): void;
  setTransform(transform: IPartialTransform): void;
  resetTransform(): void;
  flipX(): void;
  flipY(): void;
  stretchToScreen(): void;
  fitToScreen(): void;
  centerOnScreen(): void;
  rotate(deg: number): void;
  remove(): void;

  /**
   * only for scene sources
   */
  setContentCrop(): void;
}

/**
 * API for scene-items
 */
@ServiceHelper()
export class SceneItem extends SceneNode implements ISceneItemActions {
  @Fallback() private sceneItem: InternalSceneItem;
  @InjectFromExternalApi() private sourcesService: SourcesService;

  constructor(public sceneId: string, public nodeId: string, sourceId: string) {
    super(sceneId, nodeId);
    this.sceneItem = this.internalScenesService.getSceneItem(this.nodeId);
  }

  /**
   * Returns the related source for the current item
   */
  getSource(): Source {
    return this.sourcesService.getSource(this.sceneItem.sourceId);
  }

  /**
   * returns serialized representation of scene-item
   */
  getModel(): ISceneItem {
    return {
      ...super.getModel(),
      sourceId: this.getSource().sourceId,
      sceneItemId: this.sceneItem.sceneItemId,
      transform: this.sceneItem.transform,
      visible: this.sceneItem.visible,
      locked: this.sceneItem.locked,
    };
  }

  setSettings(settings: Partial<ISceneItemSettings>): void {
    return this.sceneItem.setSettings(settings);
  }

  setVisibility(visible: boolean): void {
    return this.sceneItem.setVisibility(visible);
  }

  setTransform(transform: IPartialTransform): void {
    return this.sceneItem.setTransform(transform);
  }

  resetTransform(): void {
    return this.sceneItem.resetTransform();
  }

  flipX(): void {
    return this.sceneItem.flipX();
  }

  flipY(): void {
    return this.sceneItem.flipY();
  }

  stretchToScreen(): void {
    return this.sceneItem.stretchToScreen();
  }

  fitToScreen(): void {
    return this.sceneItem.fitToScreen();
  }

  centerOnScreen(): void {
    return this.sceneItem.centerOnScreen();
  }

  rotate(deg: number): void {
    return this.sceneItem.rotate(deg);
  }

  remove(): void {
    return this.sceneItem.remove();
  }

  setScale(newScaleModel: IVec2, origin?: IVec2) {
    return this.sceneItem.setScale(newScaleModel, origin);
  }

  /**
   * only for scene sources
   */
  setContentCrop(): void {
    return this.setContentCrop();
  }
}
