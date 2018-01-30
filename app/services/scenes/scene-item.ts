import { ScenesService, Scene, ISceneItem, ISceneItemApi, ISceneItemInfo } from './index';
import { mutation, ServiceHelper } from '../stateful-service';
import Utils from '../utils';
import { SourcesService, TSourceType, ISource } from 'services/sources';
import { VideoService } from 'services/video';
import { ScalableRectangle } from '../../util/ScalableRectangle';
import { Inject } from '../../util/injector';
import { TFormData } from '../../components/shared/forms/Input';
import * as obs from '../obs-api';
import { SelectionService } from '../selection/selection';
import { ISceneItemSettings } from './scenes-api';


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

  // A visual source is visible in the editor and not locked
  get isVisualSource() {
    return (this.video && (this.width > 0) && (this.height > 0)) && !this.locked;
  }

  sceneItemState: ISceneItem;

  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private videoService: VideoService;
  @Inject() private selectionService: SelectionService;

  constructor(private sceneId: string, sceneItemId: string, sourceId: string) {

    const sceneSourceState = this.scenesService.state.scenes[sceneId].items.find(source => {
      return source.sceneItemId === sceneItemId;
    });
    const sourceState = this.sourcesService.state.sources[sourceId];
    this.sceneItemState = sceneSourceState;
    this.sceneId = sceneId;
    Utils.applyProxy(this, sourceState);
    Utils.applyProxy(this, this.sceneItemState);
  }

  getModel(): ISceneItem & ISource {
    return { ...this.sceneItemState, ...this.source.sourceState };
  }

  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }

  get source() {
    return this.sourcesService.getSource(this.sourceId);
  }

  getSource() {
    return this.source;
  }

  getObsInput() {
    return this.source.getObsInput();
  }

  getObsSceneItem(): obs.ISceneItem {
    return this.getScene().getObsScene().findItem(this.obsSceneItemId);
  }

  getSettings(): ISceneItemSettings {
    return {
      x: this.x,
      y: this.y,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      visible: this.visible,
      crop: this.crop,
      locked: this.locked,
      rotation: this.rotation
    };
  }

  setSettings(patch: Partial<ISceneItemSettings>) {

    // update only changed settings to reduce the amount of IPC calls
    const obsSceneItem = this.getObsSceneItem();
    const changed = Utils.getChangedParams(this.sceneItemState, patch);
    const newSettings = { ...this.sceneItemState, ...patch };
    const { x, y, scaleX, scaleY, visible, crop, locked, rotation } = newSettings;

    if (changed.x !== void 0 || changed.y !== void 0) {
      obsSceneItem.position = { x, y };
    }

    if (changed.scaleX !== void 0 || changed.scaleY !== void 0) {
      obsSceneItem.scale = { x: scaleX, y: scaleY };
    }

    if (changed.crop) {
      const cropModel: ICrop = {
        top: Math.round(newSettings.crop.top),
        right: Math.round(newSettings.crop.right),
        bottom: Math.round(newSettings.crop.bottom),
        left: Math.round(newSettings.crop.left)
      };
      changed.crop = cropModel;
      obsSceneItem.crop = cropModel;
    }

    if (changed.rotation !== void 0) {
      // Adjusts any positve or negative rotation value into a normalized
      // value between 0 and 360.
      const effectiveRotation = ((rotation % 360) + 360) % 360;

      this.getObsSceneItem().rotation = effectiveRotation;
      changed.rotation = effectiveRotation;
    }

    if (changed.locked !== void 0) {
      if (changed.locked && (this.selectionService.isSelected(this.sceneItemId))) {
        this.selectionService.reset();
      }
    }

    if (changed.visible) {
      this.getObsSceneItem().visible = visible;
    }

    this.UPDATE({ sceneItemId: this.sceneItemId, ...changed });
    this.scenesService.itemUpdated.next(this.sceneItemState);
  }

  remove() {
    this.scenesService.getScene(this.sceneId).removeItem(this.sceneItemId);
  }

  setPosition(vec: IVec2) {
    this.setSettings(vec);
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
    this.setSettings({ visible });
  }


  setRotation(rotation: number) {
    this.setRotation(rotation);
  }


  setPositionAndScale(x: number, y: number, scaleX: number, scaleY: number) {
    this.setSettings({ x, y, scaleX, scaleY });
  }

  setRectangle(rect: IScalableRectangle) {
    this.setPositionAndScale(
      rect.x,
      rect.y,
      rect.scaleX,
      rect.scaleY
    );
  }


  setCrop(crop: ICrop): ICrop {
    this.setCrop(crop);
    return this.sceneItemState.crop;
  }


  setPositionAndCrop(x: number, y: number, crop: ICrop) {
    this.setSettings({ x, y, crop });
  }


  setLocked(locked: boolean) {
    this.setSettings({ locked: true });
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

  loadItemAttributes(customSceneItem: ISceneItemInfo) {
    const visible = customSceneItem.visible;
    const position = { x: customSceneItem.x, y: customSceneItem.y };
    const crop = customSceneItem.crop;

    this.UPDATE({
      sceneItemId: this.sceneItemId,
      scaleX: customSceneItem.scaleX,
      scaleY: customSceneItem.scaleY,
      visible,
      ...position,
      crop,
      locked: !!customSceneItem.locked,
      rotation: customSceneItem.rotation
    });
  }

  resetTransform() {
    this.setPositionAndScale(0, 0, 1.0, 1.0);
    this.setCrop({
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    });
    this.setRotation(0);
  }

  flipY() {
    this.preservePosition(() => {
      const rect = this.getRectangle();
      rect.flipY();
      this.setRectangle(rect);
    });
  }

  flipX() {
    this.preservePosition(() => {
      const rect = this.getRectangle();
      rect.flipX();
      this.setRectangle(rect);
    });
  }


  stretchToScreen() {
    const rect = this.getRectangle();
    rect.stretchAcross(this.videoService.getScreenRectangle());
    this.setRectangle(rect);
  }


  fitToScreen() {
    const rect = this.getRectangle();
    rect.fitTo(this.videoService.getScreenRectangle());
    this.setRectangle(rect);
  }

  centerOnScreen() {
    const rect = this.getRectangle();
    rect.centerOn(this.videoService.getScreenRectangle());
    this.setRectangle(rect);
  }

  rotate(deltaRotation: number) {
    this.preservePosition(() => {
      this.setRotation(this.rotation + deltaRotation);
    });
  }


  /**
   * A rectangle representing this sceneItem
   */
  private getRectangle(): ScalableRectangle {
    return new ScalableRectangle(this);
  }

  /**
   *   Many of these transforms can unexpectedly change the position of the
   *   object.  For example, rotations happen around the NW axis.  This function
   *   records the normalized x,y position before the operation and returns it to
   *   that position after the operation has been performed.
   */
  private preservePosition(fun: Function) {
    const rect = this.getRectangle();
    rect.normalize();
    const x = rect.x;
    const y = rect.y;

    fun();

    const newRect = this.getRectangle();
    newRect.normalized(() => {
      newRect.x = x;
      newRect.y = y;
    });

    this.setPosition({ x: newRect.x, y: newRect.y });
  }

  @mutation()
  private UPDATE(patch: {sceneItemId: string} & Partial<ISceneItem>) {
    Object.assign(this.sceneItemState, patch);
  }
}
