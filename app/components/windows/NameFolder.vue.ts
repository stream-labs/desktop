import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';
import { IScenesServiceApi } from '../../services/scenes';
import { ISourcesServiceApi, TSourceType, TPropertiesManager } from '../../services/sources';
import { WidgetsService, WidgetDefinitions, WidgetType } from '../../services/widgets';

@Component({
  components: { ModalLayout },
  mixins: [windowMixin]
})
export default class NameFolder extends Vue {

  @Inject() scenesService: IScenesServiceApi;
  @Inject() windowsService: WindowsService;

  options: {
    renameId?: string,
    itemsToGroup?: string[]
  }  = this.windowsService.getChildWindowQueryParams();

  name = '';
  error = '';

  mounted() {

    if (this.options.renameId) {
      this.name = this.scenesService
        .activeScene
        .getFolder(this.options.renameId)
        .name;
    } else {
      this.name = this.scenesService.suggestName('New Folder');
    }

  }

  submit() {
    if (!this.name) {
      this.error = 'The source name is required';
    } else if (this.options.renameId) {
      const folder = this.scenesService
        .activeScene
        .getFolder(this.options.renameId);
      folder.setName(this.name);
      this.windowsService.closeChildWindow();
    } else {
      const scene = this.scenesService.activeScene;
      const newFolder = this.scenesService.activeScene.createFolder(this.name);


      if (this.options.itemsToGroup) {
        this.scenesService.activeScene
          .getSelection(this.options.itemsToGroup)
          .moveTo(scene.id, newFolder.id);
      }
      newFolder.select();

      this.windowsService.closeChildWindow();
    }
  }

}
