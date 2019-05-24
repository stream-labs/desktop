import { CombinableCommand } from './combinable-command';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import { SourceFiltersService } from 'services/source-filters';
import { Inject } from 'services/core/injector';

export class EditFilterPropertiesCommand extends CombinableCommand {
  @Inject() private sourceFiltersService: SourceFiltersService;

  beforeFormData: TObsFormData;
  afterFormData: TObsFormData;

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

    this.sourceFiltersService.setPropertiesFormData(
      this.sourceId,
      this.filterName,
      this.afterFormData || this.formData,
    );

    this.afterFormData = this.sourceFiltersService.getPropertiesFormData(
      this.sourceId,
      this.filterName,
    );
  }

  rollback() {
    this.sourceFiltersService.setPropertiesFormData(
      this.sourceId,
      this.filterName,
      this.beforeFormData,
    );
  }

  shouldCombine(other: EditFilterPropertiesCommand) {
    return this.sourceId === other.sourceId && this.filterName === other.filterName;
  }

  combine(other: EditFilterPropertiesCommand) {
    this.afterFormData = other.afterFormData;
  }
}
