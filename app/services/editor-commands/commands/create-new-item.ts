import { Command } from './command';
import { TSourceType } from 'services/sources';
import { ScenesService, ISceneNodeAddOptions } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { DualOutputService } from 'services/dual-output';
import { TDisplayType } from 'services/settings-v2/video';

export class CreateNewItemCommand extends Command {
  @Inject() private scenesService: ScenesService;
  @Inject() private dualOutputService: DualOutputService;

  private sourceId: string;
  private sceneItemId: string;

  private dualOutputVerticalNodeId: string;

  description: string;

  constructor(
    private sceneId: string,
    private name: string,
    private type: TSourceType,
    private settings?: Dictionary<any>,
    private options: ISceneNodeAddOptions = {},
  ) {
    super();
    this.description = $t('Create %{sourceName}', { sourceName: name });
  }

  execute() {
    this.options.id = this.options.id || this.sceneItemId;
    this.options.sourceAddOptions.sourceId =
      this.options.sourceAddOptions.sourceId || this.sourceId;

    const item = this.scenesService.views
      .getScene(this.sceneId)
      .createAndAddSource(this.name, this.type, this.settings, this.options);

    if (this.dualOutputService.views.dualOutputMode) {
      this.dualOutputService.actions.assignNodeContext(item, 'horizontal');

      Promise.resolve(
        this.dualOutputService.actions.return.createOrAssignOutputNode(
          item,
          'vertical',
          false,
          this.sceneId,
        ),
      ).then(id => (this.dualOutputVerticalNodeId = id));
    }

    this.sourceId = item.sourceId;
    this.sceneItemId = item.id;

    return item;
  }

  rollback() {
    this.scenesService.views.getScene(this.sceneId).removeItem(this.sceneItemId);

    if (this.dualOutputService.views.dualOutputMode && this.dualOutputVerticalNodeId) {
      this.scenesService.views.getScene(this.sceneId).removeItem(this.dualOutputVerticalNodeId);

      this.dualOutputService.removeDualOutputNodes(this.sceneItemId);
    }
  }
}
