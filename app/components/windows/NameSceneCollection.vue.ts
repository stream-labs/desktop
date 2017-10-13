import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { AppService } from '../../services/app';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';
import { ConfigPersistenceService } from '../../services/config-persistence/config';

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
  configPersistenceService: ConfigPersistenceService;

  @Inject()
  appService: AppService;

  @Inject()
  windowsService: WindowsService;

  options: INameSceneCollectionOptions = this.windowsService.getChildWindowQueryParams();

  mounted() {
    const suggestedName = this.options.scenesCollectionToDuplicate || 'New Scene Collection';
    this.name = this.configPersistenceService.suggestName(suggestedName);
  }

  submit() {
    if (this.isTaken(this.name)) {
      this.error = 'That name is already taken';
    } else if (!this.configPersistenceService.isValidName(this.name)) {
      this.error = 'Invalid name';
    } else if (this.options.rename) {
      this.configPersistenceService.renameConfig(this.name);
      this.windowsService.closeChildWindow();
    } else {
      const fromConfig = this.options.scenesCollectionToDuplicate;
      const toConfig = this.name;
      (fromConfig ?
        this.configPersistenceService.duplicateConfig(toConfig) :
        Promise.resolve<any>(this.appService.switchToBlankConfig(toConfig))
      ).then(() => {
        this.windowsService.closeChildWindow();
      });
    }
  }

  isTaken(name: string) {
    return this.configPersistenceService.state.scenesCollections.includes(name);
  }

}
