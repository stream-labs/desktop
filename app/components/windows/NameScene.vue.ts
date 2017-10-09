import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import namingHelpers from '../../util/NamingHelpers';
import windowMixin from '../mixins/window';
import { IScenesServiceApi } from '../../services/scenes';

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
  windowsService: WindowsService;

  options: { sceneToDuplicate?: string } = this.windowsService.getChildWindowQueryParams();

  mounted() {
    const suggestedName = this.options.sceneToDuplicate || 'NewScene';
    this.name = namingHelpers.suggestName(
      suggestedName, (name: string) => this.isTaken(name)
    );
  }

  submit() {
    if (this.isTaken(this.name)) {
      this.error = 'That name is already taken';
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

  isTaken(name: string) {
    return this.scenesService.getSceneByName(name);
  }

}
