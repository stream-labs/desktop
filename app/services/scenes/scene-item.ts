import { ScenesService, Scene } from '../scenes';
import { mutation, Mutator } from '../stateful-service';
import Utils from '../utils';
import { Source } from '../sources';
import { ObsSceneItem } from '../obs-api';

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
}

/**
 * A SceneItem is a source that contains
 * all of the information about that source, and
 * how it fits in to the given scene
 */
@Mutator()
export class SceneItem extends Source implements ISceneItem {
  sceneItemId: string;
  obsSceneItemId: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  crop: ICrop;

  // Some computed attributes

  get scaledWidth(): number {
    return this.width * this.scaleX;
  }

  get scaledHeight(): number {
    return this.height * this.scaleY;
  }

  // An overlay source is visible in the overlay editor
  get isOverlaySource() {
    return (this.video && (this.width > 0) && (this.height > 0));
  }

  sceneItemState: ISceneItem;
  private scenesService: ScenesService = ScenesService.instance;


  constructor(private sceneId: string, sceneItemId: string, sourceId: string) {
    super(sourceId);
    const sceneSourceState = this.scenesService.state.scenes[sceneId].items.find(source => {
      return source.sceneItemId === sceneItemId;
    });
    this.sceneItemState = sceneSourceState;
    this.sceneId = sceneId;
    Utils.applyProxy(this, this.sceneItemState);
  }


  getScene(): Scene {
    return this.scenesService.getScene(this.sceneId);
  }


  getObsSceneItem(): ObsSceneItem {
    return this.getScene().getObsScene().findItem(this.obsSceneItemId);
  }


  setPosition(vec: IVec2) {
    this.getObsSceneItem().position = { x: vec.x, y: vec.y };
    this.UPDATE({ sceneItemId: this.sceneItemId, x: vec.x, y: vec.y });
  }


  setVisibility(visible: boolean) {
    this.getObsSceneItem().visible = visible;
    this.UPDATE({ sceneItemId: this.sceneItemId, visible });
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

  @mutation()
  private UPDATE(patch: {sceneItemId: string} & Partial<ISceneItem>) {
    Object.assign(this.sceneItemState, patch);
  }
}
