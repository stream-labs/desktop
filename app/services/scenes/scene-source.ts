import { ScenesService } from './scenes';
import { mutation, Mutator } from '../stateful-service';
import Utils from '../utils';
import { Source } from '../sources';
import Obs from '../../api/Obs';

const nodeObs: Dictionary<Function> = Obs.nodeObs;

export interface ISceneSource {
  id: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
}

/**
 * A SceneSource is a source that contains
 * all of the information about that source, and
 * how it fits in to the given scene
 */
@Mutator()
export class SceneSource extends Source implements ISceneSource {
  id: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;

  // Some computed attributes

  get scaledWidth(): number {
    return this.width * this.scaleX;
  }

  get scaledHeight(): number {
    return this.height * this.scaleY;
  }

  private sceneSourceState: ISceneSource;
  private scenesService: ScenesService = ScenesService.instance;


  constructor(private sceneId: string, sourceId: string) {
    super(sourceId);
    this.sceneSourceState = this.scenesService.state.scenes[sceneId].sources.find(source => {
      return source.id === sourceId;
    });
    this.sceneId = sceneId;
    Utils.applyProxy(this, this.sceneSourceState);
  }


  setPosition(vec: IVec2) {
    const scene = this.scenesService.getSceneById(this.sceneId);
    nodeObs.OBS_content_setSourcePosition(scene.name, this.name, vec.x.toString(), vec.y.toString());
    this.UPDATE({ id: this.id, x: vec.x, y: vec.y });
  }


  setVisibility(visible: boolean) {
    const scene = this.scenesService.getSceneById(this.sceneId);
    nodeObs.OBS_content_setSourceVisibility(scene.name, this.name, visible);
    this.UPDATE({ id: this.id, visible });
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

    this.UPDATE({ id: this.id, x, y, scaleX, scaleY });
  }


  loadAttributes() {
    const scene = this.scenesService.getSceneById(this.sceneId);

    const position: IVec2 = nodeObs.OBS_content_getSourcePosition(scene.name, this.name);
    const scale: IVec2 = nodeObs.OBS_content_getSourceScaling(scene.name, this.name);
    const visible: boolean = nodeObs.OBS_content_getSourceVisibility(scene.name, this.name);

    this.UPDATE({
      id: this.id,
      scaleX: scale.x,
      scaleY: scale.y,
      visible,
      ...position
    });
  }

  @mutation
  private UPDATE(patch: TPatch<ISceneSource>) {
    Object.assign(this.sceneSourceState, patch);
  }
}
