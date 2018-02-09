import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';
import AddSourceInfo from './AddSourceInfo.vue';
import { SourcesService, TSourceType, TPropertiesManager } from '../../services/sources';
import { ScenesService } from '../../services/scenes';
import { UserService } from '../../services/user';
import { WidgetsService, WidgetType } from '../../services/widgets';


type TInspectableSource = TSourceType | WidgetType | 'streamlabel';

@Component({
  components: {
    ModalLayout,
    AddSourceInfo
  },
  mixins: [windowMixin],
})
export default class SourcesShowcase extends Vue {

  @Inject()
  sourcesService: SourcesService;

  @Inject()
  userService: UserService;

  @Inject()
  widgetsService: WidgetsService;

  @Inject()
  scenesService: ScenesService;

  @Inject()
  windowsService: WindowsService;

  widgetTypes = WidgetType;

  selectSource(sourceType: TSourceType, propertiesManager?: TPropertiesManager) {
    const sameTypeCount = this.sourcesService.getSources()
      .filter((source) => {
        return (source.type === sourceType) &&
        (source.getPropertiesManagerType() === (propertiesManager || 'default')) &&
        !source.channel;
      })
      .length;

    if (sameTypeCount > 0) {
      this.sourcesService.showAddSource(sourceType, propertiesManager);
    } else {
      this.sourcesService.showNameSource(sourceType, propertiesManager);
    }
  }

  selectWidget(type: WidgetType) {
    this.sourcesService.showNameWidget(type);
  }

  inspectedSource: TInspectableSource = null;

  inspectSource(inspectedSource: TInspectableSource) {
    this.inspectedSource = inspectedSource;
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get platform() {
    return this.userService.platform.type;
  }

  selectInspectedSource() {
    if (this.sourcesService.getAvailableSourcesTypes().includes(this.inspectedSource as TSourceType)) {
      this.selectSource(this.inspectedSource as TSourceType);
    } else if (this.inspectedSource === 'streamlabel') {
      this.selectSource('text_gdiplus', 'streamlabels');
    } else {
      this.selectWidget(this.inspectedSource as WidgetType);
    }
  }

  get availableSources() {
    return this.sourcesService.getAvailableSourcesTypesList().filter(type => {
      if (type.value === 'text_ft2_source') return false;
      if (type.value === 'scene' && this.scenesService.scenes.length <= 1) return false;
      return true;
    });
  }

}
