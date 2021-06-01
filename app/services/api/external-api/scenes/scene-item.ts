import {
  SceneItem as InternalSceneItem,
  ScenesService as InternalScenesService,
  ISceneItem as IInternalSceneItemModel,
  ISceneItem,
} from 'services/scenes';
import { InjectFromExternalApi, Fallback } from 'services/api/external-api';
import { Source, SourcesService } from 'services/api/external-api/sources';
import { getExternalNodeModel, ISceneNodeModel, SceneNode } from './scene-node';
import Utils from '../../../utils';
import { Inject, ServiceHelper } from '../../../core';

export interface ISceneItemModel extends ISceneItemSettings, ISceneNodeModel {
  sceneItemId: string;
  sourceId: string;
  name: string;
  resourceId: string;
}

export interface ISceneItemSettings {
  transform: ITransform;
  visible: boolean;
  locked: boolean;
  streamVisible: boolean;
  recordingVisible: boolean;
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
export class SceneItem extends SceneNode implements ISceneItemActions, ISceneItemModel {
  @Fallback() private sceneItem: InternalSceneItem;
  @InjectFromExternalApi() private sourcesService: SourcesService;

  sourceId: string;
  sceneItemId: string;
  name: string;
  transform: ITransform;
  visible: boolean;
  locked: boolean;
  streamVisible: boolean;
  recordingVisible: boolean;
  resourceId: string;

  constructor(public sceneId: string, public nodeId: string, sourceId: string) {
    super(sceneId, nodeId);
    this.sceneItem = this.internalScenesService.views.getSceneItem(this.nodeId);
    Utils.applyProxy(this, () => this.getModel());
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
  getModel(): ISceneItemModel {
    const sourceModel = this.getSource().getModel();
    return getExternalSceneItemModel(this.sceneItem as ISceneItem, sourceModel.name);
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

  /**
   * set scale and adjust the item position according to the origin parameter
   */
  setScale(newScaleModel: IVec2, origin?: IVec2) {
    return this.sceneItem.setScale(newScaleModel, origin);
  }

  /**
   * only for scene sources
   */
  setContentCrop(): void {
    return this.sceneItem.setContentCrop();
  }
}

export function getExternalSceneItemModel(
  internalModel: IInternalSceneItemModel,
  name: string,
): ISceneItemModel {
  const resourceId = `SceneItem["${internalModel.sceneId}", "${internalModel.sceneItemId}", "${internalModel.sourceId}"]`;
  return {
    ...getExternalNodeModel(internalModel),
    sourceId: internalModel.sourceId,
    sceneItemId: internalModel.sceneItemId,
    name,
    resourceId,
    transform: internalModel.transform,
    visible: internalModel.visible,
    locked: internalModel.locked,
    streamVisible: internalModel.streamVisible,
    recordingVisible: internalModel.recordingVisible,
  };
}
