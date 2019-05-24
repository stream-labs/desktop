import { Command } from './command';
import { Inject } from 'services/core';
import { SourceFiltersService } from 'services/source-filters';

export class ToggleFilterCommand extends Command {
  @Inject() private sourceFiltersService: SourceFiltersService;

  description: string;

  constructor(private sourceId: string, private filterName: string) {
    super();
    this.description = `${!this.filter.visible ? 'Enable' : 'Disable'} ${filterName}`;
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
