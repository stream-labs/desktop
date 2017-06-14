import { Menu } from './Menu';
import { ScenesService } from '../../services/scenes';
import VideoService from '../../services/video';
import { ScalableRectangle } from '../../util/ScalableRectangle';
import { Inject } from '../../services/service';

export class SourceTransformMenu extends Menu {
  
  @Inject()
  scenesService: ScenesService;

  constructor(private sceneId: string, private sourceId: string) {
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

  }


  resetTransform() {
    this.scenesService.setSourcePositionAndScale(
      this.sceneId,
      this.sourceId,
      0,
      0,
      1.0,
      1.0
    );
  }


  setRectangle(rect: ScalableRectangle) {
    this.scenesService.setSourcePositionAndScale(
      this.sceneId,
      this.sourceId,
      rect.x,
      rect.y,
      rect.scaleX,
      rect.scaleY
    );
  }


  getMergedSource() {
    return this.scenesService.getSource(this.sceneId, this.sourceId);
  }


  // A rectangle representing this source
  getSourceRectangle() {
    return new ScalableRectangle(this.getMergedSource());
  }


  // A rectangle representing the video output screen
  getScreenRectangle() {
    return new ScalableRectangle({
      x: 0,
      y: 0,
      width: VideoService.instance.baseWidth,
      height: VideoService.instance.baseHeight
    });
  }


  flipVertical() {
    const source = this.getSourceRectangle();
    source.flipY();
    this.setRectangle(source);
  }


  flipHorizontal() {
    const source = this.getSourceRectangle();
    source.flipX();
    this.setRectangle(source);
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

}
