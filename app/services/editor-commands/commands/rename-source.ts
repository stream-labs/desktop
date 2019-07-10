import { Command } from './command';
import { SourcesService } from 'services/sources';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';

export class RenameSourceCommand extends Command {
  @Inject() sourcesService: SourcesService;

  private oldName: string;

  constructor(private sourceId: string, private name: string) {
    super();
  }

  get description() {
    return $t('Rename %{sourceName}', { sourceName: this.oldName });
  }

  execute() {
    const source = this.sourcesService.getSource(this.sourceId);
    this.oldName = source.name;
    source.setName(this.name);
  }

  rollback() {
    this.sourcesService.getSource(this.sourceId).setName(this.oldName);
  }
}
