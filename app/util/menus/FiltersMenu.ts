import { Menu } from './Menu';
import { Inject } from '../../services/core/injector';
import { $t } from 'services/i18n';
import { SourceFiltersService } from 'services/source-filters';
import { ClipboardService } from 'services/clipboard';

export class FiltersMenu extends Menu {
  @Inject() private sourceFiltersService: SourceFiltersService;
  @Inject() private clipboardService: ClipboardService;

  constructor(private sourceId: string) {
    super();

    this.appendMenuItems();
  }

  appendMenuItems() {
    this.append({
      label: $t('Edit Filters'),
      click: () => this.sourceFiltersService.showSourceFilters(this.sourceId),
    });

    this.append({
      label: $t('Copy Filters'),
      click: () => this.clipboardService.copyFilters(this.sourceId),
    });

    this.append({
      label: $t('Paste Filters'),
      click: () => this.clipboardService.pasteFilters(this.sourceId),
      enabled: this.clipboardService.views.hasFilters(),
    });
  }
}
