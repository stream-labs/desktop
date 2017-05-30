import { Menu } from './Menu';
import { SourceTransformMenu } from './SourceTransformMenu';
import windowManager from '../WindowManager';
import SourcesService from '../../services/sources';

export class SourceMenu extends Menu {

  constructor(private sceneId: string, private sourceId: string) {
    super();

    this.appendMenuItems();
  }


  appendMenuItems() {
    this.append({
      label: 'Transform',
      submenu: this.transformSubmenu().menu
    });

    this.append({
      label: 'Filters',
      click: () => {
        this.showFilters();
      }
    });

    this.append({
      label: 'Properties',
      click: () => {
        this.showProperties();
      }
    });
  }


  transformSubmenu() {
    return new SourceTransformMenu(this.sceneId, this.sourceId);
  }


  showFilters() {
    const name = SourcesService.instance.getSourceById(this.sourceId).name;

    // TODO: This should take an id
    windowManager.showSourceFilters(name);
  }


  showProperties() {
    windowManager.showSourceProperties(this.sourceId);
  }

}
