import { Command } from './command';
import { TSourceType } from 'services/sources';
import { ScenesService, ISceneNodeAddOptions } from 'services/scenes';
import { Inject } from 'services/core/injector';

export class CreateNewItemCommand extends Command {
  @Inject() private scenesService: ScenesService;

  private sourceId: string;
  private sceneItemId: string;

  description: string;

  constructor(
    private sceneId: string,
    private name: string,
    private type: TSourceType,
    private settings?: Dictionary<any>,
    private options: ISceneNodeAddOptions = {},
  ) {
    super();
    this.description = `Create ${name}`;
  }

  execute() {
    this.options.id = this.options.id || this.sceneItemId;
    this.options.sourceAddOptions.sourceId =
      this.options.sourceAddOptions.sourceId || this.sourceId;

    const item = this.scenesService
      .getScene(this.sceneId)
      .createAndAddSource(this.name, this.type, this.settings, this.options);

    this.sourceId = item.sourceId;
    this.sceneItemId = item.id;

    return item;
  }

  rollback() {
    this.scenesService.getScene(this.sceneId).removeItem(this.sceneItemId);
  }
}
