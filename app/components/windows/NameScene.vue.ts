import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import { IScenesServiceApi } from '../../services/scenes';
import { ISourcesServiceApi } from '../../services/sources';
import { ISelectionServiceApi } from '../../services/selection';
import { $t } from 'services/i18n';

@Component({
  components: { ModalLayout }
})
export default class NameScene extends Vue {

  name = '';
  error = '';

  @Inject()
  scenesService: IScenesServiceApi;

  @Inject()
  sourcesService: ISourcesServiceApi;

  @Inject()
  windowsService: WindowsService;

  @Inject()
  selectionService: ISelectionServiceApi;

  options: {
    sceneToDuplicate?: string, // id of scene
    rename?: string, // id of scene
    itemsToGroup?: string[]
  } = this.windowsService.getChildWindowQueryParams();

  mounted() {
    let name = '';

    if (this.options.rename) {
      name = this.scenesService.getScene(this.options.rename).name;
    } else if (this.options.sceneToDuplicate) {
      name = this.scenesService.getScene(this.options.sceneToDuplicate).name;
    } else if (this.options.itemsToGroup) {
      name = `${this.scenesService.activeScene.name} Group`;
    } else {
      name = 'New Scene';
    }

    this.name = this.sourcesService.suggestName(name);
  }

  submit() {
    const activeScene = this.scenesService.activeScene;

    if (!this.name) {
      this.error = $t('The scene name is required');
    } else if (this.options.rename) {
      this.scenesService.getScene(this.options.rename).setName(this.name);
      this.windowsService.closeChildWindow();
    } else {
      const newScene = this.scenesService.createScene(
        this.name,
        {
          duplicateSourcesFromScene: this.options.sceneToDuplicate,
        }
      );
      if (this.options.itemsToGroup) {
        activeScene.getSelection(this.options.itemsToGroup).moveTo(newScene.id);
        const sceneItem = activeScene.addSource(newScene.id);
        this.selectionService.select(sceneItem.sceneItemId);
        sceneItem.setContentCrop();
      } else {
        newScene.makeActive();
      }
      this.windowsService.closeChildWindow();
    }
  }

}
