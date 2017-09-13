import { ScenesService, Scene, ISceneApi } from '../scenes';
import { mutation, ServiceHelper } from '../stateful-service';
import Utils from '../utils';
import { Source, SourcesService, TSourceType } from '../sources';
import { Inject } from '../../util/injector';
import { TFormData } from '../../components/shared/forms/Input';
import * as obs from '../obs-api';

export interface ISceneItem {
  sceneItemId: string;
  sourceId: string;
  obsSceneItemId: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  crop: ICrop;
  locked: boolean;
  rotation: number;
}


export interface ISceneItemApi extends ISceneItem {
  getScene(): ISceneApi;
  setPosition(vec: IVec2): void;
  setVisibility(visible: boolean): void;
  setPositionAndScale(x: number, y: number, scaleX: number, scaleY: number): void;
  setCrop(crop: ICrop): ICrop;
  setPositionAndCrop(x: number, y: number, crop: ICrop): void;
  setLocked(locked: boolean): void;
}


/**
 * A SceneItem is a source that contains
 * all of the information about that source, and
 * how it fits in to the given scene
 */
@ServiceHelper()
export class SceneItem implements ISceneItemApi {

  sourceId: string;
  name: string;
  type: TSourceType;
  audio: boolean;
  video: boolean;
  muted: boolean;
  width: number;
  height: number;
  properties: TFormData;
  channel?: number;

  sceneItemId: string;
  obsSceneItemId: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  crop: ICrop;
  locked: boolean;
  rotation: number;

  // Some computed attributes

  get scaledWidth(): number {
    return this.width * this.scaleX;
  }

  get scaledHeight(): number {
    return this.height * this.scaleY;
  }

  // An overlay source is visible in the overlay editor and not locked
  get isOverlaySource() {
    return (this.video && (this.width > 0) && (this.height > 0)) && !this.locked;
  }

  sceneItemState: ISceneItem;

  @Inject()
  private scenesService: ScenesService;

  @Inject()
  private sourcesService: SourcesService;


  source: Source = null;

  constructor(private sceneId: string, sceneItemId: string, sourceId: string) {

    const sceneSourceState = this.scenesService.state.scenes[sceneId].items.find(source => {
      return source.sceneItemId === sceneItemId;
    });
    this.source = this.sourcesService.getSource(sourceId);
    this.sceneItemState = sceneSourceState;
    this.sceneId = sceneId;
    Utils.applyProxy(this, this.source.sourceState);
    Utils.applyProxy(this, this.sceneItemState);
  }


  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

  getObsInput() {
    return this.source.getObsInput();
  }

  getObsSceneItem(): obs.ISceneItem {
    return this.getScene().getObsScene().findItem(this.obsSceneItemId);
  }


  setPosition(vec: IVec2) {
    this.getObsSceneItem().position = { x: vec.x, y: vec.y };
    this.UPDATE({ sceneItemId: this.sceneItemId, x: vec.x, y: vec.y });
  }


  nudgeLeft() {
    this.setPosition({ x: this.x - 1, y: this.y });
  }


  nudgeRight() {
    this.setPosition({ x: this.x + 1, y: this.y });
  }


  nudgeUp() {
    this.setPosition({ x: this.x, y: this.y - 1 });
  }


  nudgeDown() {
    this.setPosition({ x: this.x, y: this.y + 1 });
  }


  setVisibility(visible: boolean) {
    this.getObsSceneItem().visible = visible;
    this.UPDATE({ sceneItemId: this.sceneItemId, visible });
  }


  setRotation(rotation: number) {
    // Adjusts any positve or negative rotation value into a normalized
    // value between 0 and 360.
    const effectiveRotation = ((rotation % 360) + 360) % 360;

    this.getObsSceneItem().rotation = effectiveRotation;
    this.UPDATE({ sceneItemId: this.sceneItemId, rotation: effectiveRotation });
  }


  setPositionAndScale(x: number, y: number, scaleX: number, scaleY: number) {
    const obsSceneItem = this.getObsSceneItem();
    obsSceneItem.position = { x, y };
    obsSceneItem.scale = { x: scaleX, y: scaleY };
    this.UPDATE({ sceneItemId: this.sceneItemId, x, y, scaleX, scaleY });
  }


  setCrop(crop: ICrop): ICrop {
    const cropModel: ICrop = {
      top: Math.round(crop.top),
      right: Math.round(crop.right),
      bottom: Math.round(crop.bottom),
      left: Math.round(crop.left)
    };
    this.getObsSceneItem().crop = cropModel;
    this.UPDATE({ sceneItemId: this.sceneItemId, crop: { ...crop } });
    return cropModel;
  }


  setPositionAndCrop(x: number, y: number, crop: ICrop) {
    const obsSceneItem = this.getObsSceneItem();
    this.setCrop(crop);
    obsSceneItem.position = { x, y };
    this.UPDATE({ sceneItemId: this.sceneItemId, x, y });
  }


  setLocked(locked: boolean) {
    const scene = this.getScene();
    if (locked && (scene.activeItemId === this.sceneItemId)) {
      scene.makeItemActive(null);
    }

    this.UPDATE({ sceneItemId: this.sceneItemId, locked });
  }


  loadAttributes() {
    const { position, scale, visible, crop } = this.getObsSceneItem();
    this.UPDATE({
      sceneItemId: this.sceneItemId,
      scaleX: scale.x,
      scaleY: scale.y,
      visible,
      ...position,
      crop
    });
  }

  loadItemAttributes(customSceneItem: obs.ISceneItemInfo) {
    const visible = customSceneItem.visible;
    const position = { x: customSceneItem.x, y: customSceneItem.y };
    const crop = customSceneItem.crop;

    this.UPDATE({
      sceneItemId: this.sceneItemId,
      scaleX: customSceneItem.scaleX,
      scaleY: customSceneItem.scaleY,
      visible,
      ...position,
      crop
    });
  }

  @mutation()
  private UPDATE(patch: {sceneItemId: string} & Partial<ISceneItem>) {
    Object.assign(this.sceneItemState, patch);
  }
}
