import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/core/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import { ScenesService } from '../../services/scenes';
import { $t } from 'services/i18n';
import { EditorCommandsService } from 'services/editor-commands';

@Component({
  components: { ModalLayout },
})
export default class NameFolder extends Vue {
  @Inject() scenesService: ScenesService;
  @Inject() windowsService: WindowsService;
  @Inject() private editorCommandsService: EditorCommandsService;

  options: {
    renameId?: string;
    itemsToGroup?: string[];
    parentId?: string;
    sceneId?: string;
  } = this.windowsService.getChildWindowQueryParams();

  name = '';
  error = '';

  mounted() {
    if (this.options.renameId) {
      this.name = this.scenesService
        .getScene(this.options.sceneId)
        .getFolder(this.options.renameId).name;
    } else {
      this.name = this.scenesService.suggestName('New Folder');
    }
  }

  submit() {
    if (!this.name) {
      this.error = $t('The source name is required');
    } else if (this.options.renameId) {
      this.editorCommandsService.executeCommand(
        'RenameFolderCommand',
        this.options.sceneId,
        this.options.renameId,
        this.name,
      );
      this.windowsService.closeChildWindow();
    } else {
      const scene = this.scenesService.getScene(this.options.sceneId);

      this.editorCommandsService.executeCommand(
        'CreateFolderCommand',
        this.options.sceneId,
        this.name,
        this.options.itemsToGroup && this.options.itemsToGroup.length > 0
          ? scene.getSelection(this.options.itemsToGroup)
          : void 0,
      );

      this.windowsService.closeChildWindow();
    }
  }
}
