import { Command } from './command';
import { Inject } from 'services/core/injector';
import { ISourceAddOptions, SourcesService, TSourceType } from 'services/sources';
import { $t } from '../../i18n';

/**
 * Removes the source
 * Works for global sources only (with channel > 0)
 */
export class RemoveSourceCommand extends Command {
  @Inject() private sourcesService: SourcesService;

  private name: string;
  private type: TSourceType;
  private addSourceOptions: ISourceAddOptions<any>;

  constructor(private sourceId: string) {
    super();
  }

  get description() {
    return `${$t('Remove source')} ${this.name}`;
  }

  execute() {
    const source = this.sourcesService.getSource(this.sourceId);
    this.name = source.name;
    this.type = source.type;
    this.addSourceOptions = {
      sourceId: source.sourceId,
      channel: source.channel,
    };
    this.sourcesService.removeSource(this.sourceId);
  }

  rollback() {
    this.sourcesService.createSource(this.name, this.type, {}, this.addSourceOptions);
  }
}
