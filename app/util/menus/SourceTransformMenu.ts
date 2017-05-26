import { Menu } from './Menu';
import ScenesService from '../../services/scenes';

export class SourceTransformMenu extends Menu {

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
  }


  resetTransform() {
    ScenesService.instance.resetSourceTransform(this.sceneId, this.sourceId);
  }


  flipVertical() {
    ScenesService.instance.flipSourceVertical(this.sceneId, this.sourceId);
  }


  flipHorizontal() {
    ScenesService.instance.flipSourceHorizontal(this.sceneId, this.sourceId);
  }

}
