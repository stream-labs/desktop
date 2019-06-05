import { Command } from './command';
import { Inject } from 'services/core';
import { SourceFiltersService } from 'services/source-filters';
import { $t } from 'services/i18n';

export class ToggleFilterCommand extends Command {
  @Inject() private sourceFiltersService: SourceFiltersService;

  description: string;

  constructor(private sourceId: string, private filterName: string) {
    super();
    const action = !this.filter.visible ? 'Enable %{filterName}' : 'Disable %{filterName}';
    this.description = $t(action, { filterName });
  }

  execute() {
    this.sourceFiltersService.setVisibility(this.sourceId, this.filterName, !this.filter.visible);
  }

  rollback() {
    this.sourceFiltersService.setVisibility(this.sourceId, this.filterName, !this.filter.visible);
  }

  private get filter() {
    return this.sourceFiltersService
      .getFilters(this.sourceId)
      .find(f => f.name === this.filterName);
  }
}
