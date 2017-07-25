import { ScenesService, Scene } from '../scenes';
import { mutation, Mutator } from '../stateful-service';
import Utils from '../utils';
import { Source } from '../sources';
import { nodeObs, ObsSceneItem } from '../obs-api';

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
    const scene = this.scenesService.getSceneById(this.sceneId);
    nodeObs.OBS_content_setSourcePosition(scene.name, this.name, vec.x.toString(), vec.y.toString());
    this.UPDATE({ id: this.sceneItemId, x: vec.x, y: vec.y });
  }


  setVisibility(visible: boolean) {
    const scene = this.scenesService.getSceneById(this.sceneId);
    nodeObs.OBS_content_setSourceVisibility(scene.name, this.name, visible);
    this.UPDATE({ id: this.sceneItemId, visible });
  }


  setPositionAndScale(x: number, y: number, scaleX: number, scaleY: number) {
    const scene = this.scenesService.getSceneById(this.sceneId);

    // Uses a virtual node-obs function to set position and
    // scale atomically.  This is required for smooth resizing.
    nodeObs.OBS_content_setSourcePositionAndScale(
      scene.name,
      this.name,
      x.toString(),
      y.toString(),
      scaleX.toString(),
      scaleY.toString()
    );

    this.UPDATE({ id: this.sceneItemId, x, y, scaleX, scaleY });
  }


  setCrop(crop: ICrop) {
    const scene = this.scenesService.getSceneById(this.sceneId);
    nodeObs.OBS_content_setSceneItemCrop(scene.name, this.name, crop);
    this.UPDATE({ id: this.sceneItemId, crop: { ...crop } });
  }


  setPositionAndCrop(x: number, y: number, crop: ICrop) {
    const scene = this.scenesService.getSceneById(this.sceneId);
    nodeObs.OBS_content_setSourcePositionAndCrop(scene.name, this.name, x.toString(), y.toString(), crop);
    this.UPDATE({ id: this.sceneItemId, x, y, crop: { ...crop } });
  }


  loadAttributes() {
    const scene = this.scenesService.getSceneById(this.sceneId);

    const position: IVec2 = nodeObs.OBS_content_getSourcePosition(scene.name, this.name);
    const scale: IVec2 = nodeObs.OBS_content_getSourceScaling(scene.name, this.name);
    const visible: boolean = nodeObs.OBS_content_getSourceVisibility(scene.name, this.name);
    const crop: ICrop = nodeObs.OBS_content_getSceneItemCrop(scene.name, this.name);

    this.UPDATE({
      id: this.sceneItemId,
      scaleX: scale.x,
      scaleY: scale.y,
      visible,
      ...position,
      crop
    });
  }

  @mutation()
  private UPDATE(patch: TPatch<ISceneItem>) {
    Object.assign(this.sceneItemState, patch);
  }
}
