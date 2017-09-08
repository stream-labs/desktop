import { Menu } from './Menu';
import { ScenesService } from '../../services/scenes';
import { VideoService } from '../../services/video';
import { ScalableRectangle } from '../../util/ScalableRectangle';
import { Inject } from '../../util/injector';

export class SourceTransformMenu extends Menu {

  @Inject()
  scenesService: ScenesService;

  @Inject()
  videoService: VideoService;

  source = this.scenesService.getScene(this.sceneId).getItem(this.sceneItemId);

  constructor(private sceneId: string, private sceneItemId: string) {
    super();

    this.appendMenuItems();
  }


  appendMenuItems() {
    this.append({
      label: 'Reset Transform',
      click: () => {
        this.resetTransform();
      }
    });

    this.append({
      label: 'Flip Vertical',
      click: () => {
        this.flipVertical();
      }
    });

    this.append({
      label: 'Flip Horizontal',
      click: () => {
        this.flipHorizontal();
      }
    });

    this.append({
      label: 'Stretch to Screen',
      click: () => {
        this.stretchToScreen();
      }
    });

    this.append({
      label: 'Fit to Screen',
      click: () => {
        this.fitToScreen();
      }
    });

    this.append({
      label: 'Center on Screen',
      click: () => {
        this.centerOnScreen();
      }
    });

    this.append({
      label: 'Rotate 90 degrees CW',
      click: () => {
        this.rotate(90);
      }
    });

    this.append({
      label: 'Rotate 90 degrees CCW',
      click: () => {
        this.rotate(-90);
      }
    });

    this.append({
      label: 'Rotate 180 degrees',
      click: () => {
        this.rotate(180);
      }
    });
  }


  resetTransform() {
    this.source.setPositionAndScale(0, 0, 1.0, 1.0);
    this.source.setCrop({
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    });
    this.source.setRotation(0);
  }


  setRectangle(rect: ScalableRectangle) {
    this.source.setPositionAndScale(
      rect.x,
      rect.y,
      rect.scaleX,
      rect.scaleY
    );
  }


  // A rectangle representing this source
  getSourceRectangle() {
    return new ScalableRectangle(this.source);
  }


  // A rectangle representing the video output screen
  getScreenRectangle() {
    return new ScalableRectangle({
      x: 0,
      y: 0,
      width: this.videoService.baseWidth,
      height: this.videoService.baseHeight
    });
  }


  flipVertical() {
    this.preservePosition(() => {
      const source = this.getSourceRectangle();
      source.flipY();
      this.setRectangle(source);
    });
  }


  flipHorizontal() {
    this.preservePosition(() => {
      const source = this.getSourceRectangle();
      source.flipX();
      this.setRectangle(source);
    });
  }


  stretchToScreen() {
    const source = this.getSourceRectangle();
    source.stretchAcross(this.getScreenRectangle());
    this.setRectangle(source);
  }


  fitToScreen() {
    const source = this.getSourceRectangle();
    source.fitTo(this.getScreenRectangle());
    this.setRectangle(source);
  }


  centerOnScreen() {
    const source = this.getSourceRectangle();
    source.centerOn(this.getScreenRectangle());
    this.setRectangle(source);
  }


  rotate(deltaRotation: number) {
    this.preservePosition(() => {
      this.source.setRotation(this.source.rotation + deltaRotation);
    });
  }

  // Many of these transforms can unexpectedly change the position of the
  // object.  For example, rotations happen around the NW axis.  This function
  // records the normalized x,y position before the operation and returns it to
  // that position after the operation has been performed.
  preservePosition(fun: Function) {
    const rect = this.getSourceRectangle();
    rect.normalize();
    const x = rect.x;
    const y = rect.y;

    fun();

    const newRect = this.getSourceRectangle();
    newRect.normalized(() => {
      newRect.x = x;
      newRect.y = y;
    });

    this.source.setPosition({ x: newRect.x, y: newRect.y });
  }

}
