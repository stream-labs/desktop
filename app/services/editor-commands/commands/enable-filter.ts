import { Command } from './command';
import { Inject } from 'services/core';
import { SourceFiltersService } from 'services/source-filters';

export class EnableFilterCommand extends Command {
  @Inject() private sourceFiltersService: SourceFiltersService;

  description: string;

  constructor(private sourceId: string, private filterName: string, private enabled: boolean) {
    super();
    this.description = `${enabled ? 'Enable' : 'Disable'} ${filterName}`;
  }

  execute() {
    this.sourceFiltersService.setVisibility(this.sourceId, this.filterName, this.enabled);
  }

  rollback() {
    this.sourceFiltersService.setVisibility(this.sourceId, this.filterName, !this.enabled);
  }
}
