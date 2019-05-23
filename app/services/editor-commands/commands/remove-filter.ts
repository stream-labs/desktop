import { Command } from './command';
import { SourceFiltersService, ISourceFilter } from 'services/source-filters';
import { Inject } from 'services/core/injector';

export class RemoveFilterCommand extends Command {
  @Inject() private sourceFiltersService: SourceFiltersService;

  removedFilter: ISourceFilter;
  removedFilterIndex: number;

  constructor(private sourceId: string, private filterName: string) {
    super();
  }

  get description() {
    return `Remove ${this.removedFilter.name}`;
  }

  execute() {
    this.removedFilter = this.sourceFiltersService
      .getFilters(this.sourceId)
      .find((filter, index) => {
        if (filter.name === this.filterName) {
          this.removedFilterIndex = index;
          return true;
        }
      });

    this.sourceFiltersService.remove(this.sourceId, this.filterName);
  }

  rollback() {
    this.sourceFiltersService.add(
      this.sourceId,
      this.removedFilter.type,
      this.removedFilter.name,
      this.removedFilter.settings,
    );

    this.sourceFiltersService.setVisibility(
      this.sourceId,
      this.removedFilter.name,
      this.removedFilter.visible,
    );
  }
}
