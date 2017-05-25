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
  }


  resetTransform() {
    ScenesService.instance.resetSourceTransform(this.sceneId, this.sourceId);
  }

}
