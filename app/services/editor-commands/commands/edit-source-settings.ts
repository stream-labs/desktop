import { CombinableCommand } from './combinable-command';
import { SourcesService } from 'services/sources';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';

/**
 * This command is extremely similar to EditSourceProperties
 * except that it operates with raw settings values instead
 * of OBS form data objects.
 */
export class EditSourceSettingsCommand extends CombinableCommand {
  @Inject() sourcesService: SourcesService;

  description: string;

  private beforeSettings: Dictionary<any>;
  private afterSettings: Dictionary<any>;

  constructor(private sourceId: string, private settings: Dictionary<any>) {
    super();

    this.description = $t('Edit %{sourceName}', {
      sourceName: this.sourcesService.views.getSource(this.sourceId).name,
    });
  }

  execute() {
    const source = this.sourcesService.views.getSource(this.sourceId);

    this.beforeSettings = source.getSettings();
    source.updateSettings(this.afterSettings ?? this.settings);
    this.afterSettings = source.getSettings();
  }

  rollback() {
    this.sourcesService.views.getSource(this.sourceId).updateSettings(this.beforeSettings);
  }

  shouldCombine(other: EditSourceSettingsCommand) {
    return this.sourceId === other.sourceId;
  }

  combine(other: EditSourceSettingsCommand) {
    this.afterSettings = other.afterSettings;
  }
}
