import { Command } from './command';
import { AddFilterCommand } from './add-filter';
import { TSourceFilterType } from 'services/source-filters';

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
    // TODO: More verbose description?
    this.description = 'Paste filters';
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
