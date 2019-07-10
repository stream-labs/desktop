import { Command } from './command';
import { SourcesService } from 'services/sources';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';

/**
 * Creates an item from an existing source
 */
export class CreateExistingItemCommand extends Command {
  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;

  private sceneItemId: string;

  description: string;

  constructor(private sceneId: string, private sourceId: string) {
    super();
    this.description = $t('Create %{sourceName}', {
      sourceName: this.sourcesService.getSource(this.sourceId).name,
    });
  }

  execute() {
    const item = this.scenesService
      .getScene(this.sceneId)
      .addSource(this.sourceId, { id: this.sceneItemId });

    this.sceneItemId = item.id;
  }

  rollback() {
    this.scenesService.getScene(this.sceneId).removeItem(this.sceneItemId);
  }
}
