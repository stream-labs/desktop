import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/core/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import { ScenesService, Scene } from 'services/scenes';
import { ISourcesServiceApi } from '../../services/sources';
import { SelectionService } from 'services/selection';
import { $t } from 'services/i18n';
import { EditorCommandsService } from 'services/editor-commands';
import { ISceneCreateOptions } from 'services/editor-commands/commands/create-scene';

@Component({
  components: { ModalLayout },
})
export default class NameScene extends Vue {
  name = '';
  error = '';

  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: ISourcesServiceApi;
  @Inject() private windowsService: WindowsService;
  @Inject() private selectionService: SelectionService;
  @Inject() private editorCommandsService: EditorCommandsService;

  options: {
    sceneToDuplicate?: string; // id of scene
    rename?: string; // id of scene
    itemsToGroup?: string[];
  } = this.windowsService.getChildWindowQueryParams();

  mounted() {
    let name = '';

    if (this.options.rename) {
      name = this.scenesService.getScene(this.options.rename).name;
      this.name = name;
    } else if (this.options.sceneToDuplicate) {
      name = this.scenesService.getScene(this.options.sceneToDuplicate).name;
    } else if (this.options.itemsToGroup) {
      name = `${this.scenesService.activeScene.name} Group`;
    } else {
      name = 'New Scene';
    }
    if (!this.options.rename) this.name = this.sourcesService.suggestName(name);
  }

  async submit() {
    if (!this.name) {
      this.error = $t('The scene name is required');
    } else if (this.options.rename) {
      this.editorCommandsService.executeCommand(
        'RenameSceneCommand',
        this.options.rename,
        this.name,
      );

      this.windowsService.closeChildWindow();
    } else {
      const options: ISceneCreateOptions = {};

      if (this.options.sceneToDuplicate) {
        options.duplicateItemsFromScene = this.options.sceneToDuplicate;
      }

      if (this.options.itemsToGroup) {
        options.groupFromOrigin = {
          originSceneId: this.scenesService.activeSceneId,
          originItemIds: this.options.itemsToGroup,
        };
      }

      // TODO: Return values for executeCommand
      const newSceneId = (await this.editorCommandsService.executeCommand(
        'CreateSceneCommand',
        this.name,
        options,
      )) as string;

      this.scenesService.getScene(newSceneId).makeActive();

      this.windowsService.closeChildWindow();
    }
  }
}
