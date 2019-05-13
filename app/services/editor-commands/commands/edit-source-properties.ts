import { Command } from './command';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import { SourcesService } from 'services/sources';
import { Inject } from 'services/core/injector';

export class EditSourcePropertiesCommand extends Command {
  @Inject() sourcesService: SourcesService;

  description: string;

  private beforeFormData: TObsFormData;

  constructor(private sourceId: string, private formData: TObsFormData) {
    super();

    this.description = `Edit ${this.sourcesService.getSource(this.sourceId).name}`;
  }

  execute() {
    const source = this.sourcesService.getSource(this.sourceId);

    this.beforeFormData = source.getPropertiesFormData();
    source.setPropertiesFormData(this.formData);
  }

  rollback() {
    this.sourcesService.getSource(this.sourceId).setPropertiesFormData(this.beforeFormData);
  }
}
