import { Command } from './command';
import { Inject } from 'services/core';
import { SourceFiltersService } from 'services/source-filters';

export class ReorderFiltersCommand extends Command {
  @Inject() private sourceFiltersService: SourceFiltersService;

  description: string;

  constructor(private sourceId: string, private filterName: string, private delta: number) {
    super();
    this.description = `Reorder ${filterName}`;
  }

  execute() {
    this.sourceFiltersService.setOrder(this.sourceId, this.filterName, this.delta);
  }

  rollback() {
    this.sourceFiltersService.setOrder(this.sourceId, this.filterName, this.delta * -1);
  }
}
