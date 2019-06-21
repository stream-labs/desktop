import { Command } from './command';
import { Inject } from 'services/core';
import { SourceFiltersService } from 'services/source-filters';
import { $t } from 'services/i18n';

export class ReorderFiltersCommand extends Command {
  @Inject() private sourceFiltersService: SourceFiltersService;

  description: string;

  constructor(private sourceId: string, private filterName: string, private delta: number) {
    super();
    this.description = $t('Reorder %{filterName}', { filterName });
  }

  execute() {
    this.sourceFiltersService.setOrder(this.sourceId, this.filterName, this.delta);
  }

  rollback() {
    this.sourceFiltersService.setOrder(this.sourceId, this.filterName, this.delta * -1);
  }
}
