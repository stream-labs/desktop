import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';
import { IScenesServiceApi } from '../../services/scenes';
import { ISourcesServiceApi } from '../../services/sources';
import { ISelectionServiceApi } from '../../services/selection';

@Component({
  components: { ModalLayout },
  mixins: [windowMixin]
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
    sceneToDuplicate?: string,
    rename?: string,
    itemsToGroup?: string[]
  } = this.windowsService.getChildWindowQueryParams();

  mounted() {
    this.name = this.options.rename ?
      this.options.rename :
      this.sourcesService.suggestName(
        this.options.sceneToDuplicate ||
        this.options.itemsToGroup ? 'Group' : 'NewScene'
      );
  }

  submit() {
    const activeScene = this.scenesService.activeScene;

    if (!this.name) {
      this.error = 'The scene name is required';
    } else if (this.options.rename) {
      this.scenesService.getSceneByName(this.options.rename).setName(this.name);
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
