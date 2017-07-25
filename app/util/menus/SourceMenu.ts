import { Inject } from '../../services/service';
import { Menu } from './Menu';
import { WindowService } from '../../services/window';
import { SourcesService } from '../../services/sources';

export class SourceMenu extends Menu {

  @Inject()
  private sourcesService: SourcesService;

  private windowService = WindowService.instance;

  private source = this.sourcesService.getSource(this.sourceId);

  constructor(private sourceId: string) {
    super();

    this.appendSourceMenuItems();
  }


  private appendSourceMenuItems() {

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

  private showFilters() {
    // TODO: This should take an id
    this.windowService.showSourceFilters(this.source.name);
  }


  private showProperties() {
    this.windowService.showSourceProperties(this.sourceId);
  }

}
