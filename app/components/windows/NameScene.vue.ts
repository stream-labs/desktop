import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';
import { IScenesServiceApi } from '../../services/scenes';
import { ISourcesServiceApi } from '../../services/sources';

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

  options: { sceneToDuplicate?: string, rename?: string } = this.windowsService.getChildWindowQueryParams();

  mounted() {
    this.name = this.options.rename ?
      this.options.rename :
      this.sourcesService.suggestName(this.options.sceneToDuplicate || 'NewScene');
  }

  submit() {
    if (!this.name) {
      this.error = 'The scene name is required';
    } else if (this.options.rename) {
      this.scenesService.getSceneByName(this.options.rename).setName(this.name);
      this.windowsService.closeChildWindow();
    } else {
      this.scenesService.createScene(
        this.name,
        {
          duplicateSourcesFromScene: this.options.sceneToDuplicate,
          makeActive: true
        }
      );
      this.windowsService.closeChildWindow();
    }
  }

}
