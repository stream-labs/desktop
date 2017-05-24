import { Menu, menuItem } from './Menu.ts';
import windowManager from '../WindowManager';
import SourcesService from '../../services/sources';

export class SourceMenu extends Menu {

  sourceId: string;

  constructor(sourceId: string) {
    super();

    this.sourceId = sourceId;
  }


  @menuItem({ label: 'Filters' })
  showFilters() {
    const name = SourcesService.instance.getSourceById(this.sourceId).name;

    // TODO: This should take an id
    windowManager.showSourceFilters(name);
  }


  @menuItem({ label: 'Properties' })
  showProperties() {
    windowManager.showSourceProperties(this.sourceId);
  }

}
