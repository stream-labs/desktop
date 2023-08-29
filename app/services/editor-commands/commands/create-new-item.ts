import { Command } from './command';
import { TSourceType } from 'services/sources';
import { ScenesService, ISceneNodeAddOptions } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { DualOutputService } from 'services/dual-output';
import { SceneCollectionsService } from 'services/scene-collections';

/**
 * Creates a new item
 *
 * @remarks
 * For vanilla scenes, create a new item.
 * For dual output scenes, create a new item and a corresponding vertical item.
 *
 * @param sceneId - The scene id
 * @param name - The scene item name
 * @param type - The scene item type
 * @param settings - Optional, A Dictionary of settings
 * @param options - Optional, ISceneNodeAddOptions, defaults to an empty object,
 */
export class CreateNewItemCommand extends Command {
  @Inject() private scenesService: ScenesService;
  @Inject() private dualOutputService: DualOutputService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;

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
    private verticalNodeId?: string,
  ) {
    super();
    this.description = $t('Create %{sourceName}', { sourceName: name });
    this.dualOutputVerticalNodeId = this.verticalNodeId;
  }

  execute() {
    this.options.id = this.options.id || this.sceneItemId;
    this.options.sourceAddOptions.sourceId =
      this.options.sourceAddOptions.sourceId || this.sourceId;
    this.options.display = 'horizontal';

    const item = this.scenesService.views
      .getScene(this.sceneId)
      .createAndAddSource(this.name, this.type, this.settings, this.options);

    // check the existence of all scene node maps because the scene may not have a
    // node map created for it
    if (this.dualOutputService.views.hasSceneNodeMaps) {
      if (this.dualOutputVerticalNodeId) {
        Promise.resolve(
          this.dualOutputService.actions.return.createOrAssignOutputNode(
            item,
            'vertical',
            false,
            this.sceneId,
            this.dualOutputVerticalNodeId,
          ),
        );
      } else {
        Promise.resolve(
          this.dualOutputService.actions.return.createOrAssignOutputNode(
            item,
            'vertical',
            false,
            this.sceneId,
          ),
        ).then(node => {
          this.dualOutputVerticalNodeId = node.id;
        });
      }
    }

    this.sourceId = item.sourceId;
    this.sceneItemId = item.id;

    return item;
  }

  rollback() {
    this.scenesService.views.getScene(this.sceneId).removeItem(this.sceneItemId);

    if (this.dualOutputVerticalNodeId) {
      this.scenesService.views.getScene(this.sceneId).removeItem(this.dualOutputVerticalNodeId);
      this.sceneCollectionsService.removeNodeMapEntry(this.sceneId, this.sceneItemId);
    }
  }
}
