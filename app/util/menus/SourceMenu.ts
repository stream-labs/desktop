import { Menu } from './Menu';
import { SourceTransformMenu } from './SourceTransformMenu';
import windowManager from '../WindowManager';
import SourcesService from '../../services/sources';
import ScenesService from '../../services/scenes';

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

    const visibilityLabel = this.mergedSource.visible ? 'Hide' : 'Show';

    this.append({
      label: visibilityLabel,
      click: () => {
        this.toggleVisibility();
      }
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


  get mergedSource() {
    return ScenesService.instance.getMergedSource(this.sceneId, this.sourceId);
  }


  toggleVisibility() {
    ScenesService.instance.setSourceVisibility(
      this.sceneId,
      this.sourceId,
      !this.mergedSource.visible
    );
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
