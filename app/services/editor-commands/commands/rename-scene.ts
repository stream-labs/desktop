import { Command } from './command';
import { ScenesService } from 'services/scenes';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';

export class RenameSceneCommand extends Command {
  @Inject() scenesService: ScenesService;

  private oldName: string;

  constructor(private sceneId: string, private name: string) {
    super();
  }

  get description() {
    return $t('Rename %{sceneName}', { sceneName: this.oldName });
  }

  execute() {
    const scene = this.scenesService.getScene(this.sceneId);
    this.oldName = scene.name;
    scene.setName(this.name);
  }

  rollback() {
    this.scenesService.getScene(this.sceneId).setName(this.oldName);
  }
}
