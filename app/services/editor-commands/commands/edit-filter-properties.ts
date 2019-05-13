import { Command } from './command';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import { SourceFiltersService } from 'services/source-filters';
import { Inject } from 'services/core/injector';

export class EditFilterPropertiesCommand extends Command {
  @Inject() private sourceFiltersService: SourceFiltersService;

  beforeFormData: TObsFormData;

  description: string;

  constructor(
    private sourceId: string,
    private filterName: string,
    private formData: TObsFormData,
  ) {
    super();

    this.description = `Edit ${this.filterName}`;
  }

  execute() {
    this.beforeFormData = this.sourceFiltersService.getPropertiesFormData(
      this.sourceId,
      this.filterName,
    );

    this.sourceFiltersService.setPropertiesFormData(this.sourceId, this.filterName, this.formData);
  }

  rollback() {
    this.sourceFiltersService.setPropertiesFormData(
      this.sourceId,
      this.filterName,
      this.beforeFormData,
    );
  }
}
