import { Command } from './command';
import { AddFilterCommand } from './add-filter';
import { TSourceFilterType } from 'services/source-filters';
import { $t } from 'services/i18n';

export interface IFilterData {
  name: string;
  type: TSourceFilterType;
  settings: Dictionary<any>;
}

export class PasteFiltersCommand extends Command {
  private addFilterSubcommands: AddFilterCommand[];

  description: string;

  constructor(private sourceId: string, private filterData: IFilterData[]) {
    super();
    this.description = $t('Paste %{filterName}', { filterName: this.filterData[0].name });
  }

  execute() {
    this.addFilterSubcommands = [];

    this.filterData.forEach(filterData => {
      const subcommand = new AddFilterCommand(
        this.sourceId,
        filterData.type,
        filterData.name,
        filterData.settings,
      );
      this.addFilterSubcommands.push(subcommand);
      subcommand.execute();
    });
  }

  rollback() {
    this.addFilterSubcommands.forEach(subcommand => subcommand.rollback());
  }
}
