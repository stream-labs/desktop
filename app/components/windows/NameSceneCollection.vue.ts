import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { AppService } from '../../services/app';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';
import { ScenesCollectionsService } from '../../services/scenes-collections/config';

interface INameSceneCollectionOptions {
  rename?: string;
  scenesCollectionToDuplicate?: string;
}

@Component({
  components: { ModalLayout },
  mixins: [windowMixin]
})
export default class NameSceneCollection extends Vue {

  name = '';
  error = '';

  @Inject()
  scenesCollectionsService: ScenesCollectionsService;

  @Inject()
  appService: AppService;

  @Inject()
  windowsService: WindowsService;

  options: INameSceneCollectionOptions = this.windowsService.getChildWindowQueryParams();

  mounted() {
    const suggestedName = this.options.scenesCollectionToDuplicate || 'New Scene Collection';
    this.name = this.scenesCollectionsService.suggestName(suggestedName);
  }

  submit() {
    if (this.isTaken(this.name)) {
      this.error = 'That name is already taken';
    } else if (!this.scenesCollectionsService.isValidName(this.name)) {
      this.error = 'Invalid name';
    } else if (this.options.rename) {
      this.scenesCollectionsService.renameConfig(this.name);
      this.windowsService.closeChildWindow();
    } else {
      const fromConfig = this.options.scenesCollectionToDuplicate;
      const toConfig = this.name;
      (fromConfig ?
        this.scenesCollectionsService.duplicateConfig(toConfig) :
        Promise.resolve<any>(this.appService.switchToBlankConfig(toConfig))
      ).then(() => {
        this.windowsService.closeChildWindow();
      });
    }
  }

  isTaken(name: string) {
    return this.scenesCollectionsService.state.scenesCollections.includes(name);
  }

}
