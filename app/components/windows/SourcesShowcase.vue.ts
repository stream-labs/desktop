import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import ModalLayout from 'components/ModalLayout.vue';
import { WindowsService } from 'services/windows';
import AddSourceInfo from './AddSourceInfo.vue';
import { SourcesService, TSourceType, TPropertiesManager, SourceDisplayData } from 'services/sources';
import { ScenesService } from 'services/scenes';
import { UserService } from 'services/user';
import { WidgetsService, WidgetType, WidgetDisplayData } from 'services/widgets';


type TInspectableSource = TSourceType | WidgetType | 'streamlabel';

interface ISelectSourceOptions {
  propertiesManager?: TPropertiesManager;
  widgetType?: WidgetType;
}

@Component({
  components: {
    ModalLayout,
    AddSourceInfo
  }
})
export default class SourcesShowcase extends Vue {
  @Inject() sourcesService: SourcesService;
  @Inject() userService: UserService;
  @Inject() widgetsService: WidgetsService;
  @Inject() scenesService: ScenesService;
  @Inject() windowsService: WindowsService;

  widgetTypes = WidgetType;
  essentialWidgetTypes = new Set([this.widgetTypes.AlertBox]);

  iterableWidgetTypes = Object.keys(this.widgetTypes)
    .filter((type: string) => isNaN(Number(type)))
    .sort((a: string, b: string) => {
      return this.essentialWidgetTypes.has(this.widgetTypes[a]) ? -1 : 1;
    });


  selectSource(sourceType: TSourceType, options: ISelectSourceOptions = {}) {
    const managerType = options.propertiesManager || 'default';
    this.sourcesService.showAddSource(sourceType, managerType, options.widgetType);
  }

  getSrc(type: string, theme: string) {
    const dataSource = this.widgetData(type) ? this.widgetData : this.sourceData;
    return require(`../../../media/source-demos/${theme}/${dataSource(type).demoFilename}`);
  }

  selectWidget(type: WidgetType) {
    this.selectSource('browser_source', {
      propertiesManager: 'widget',
      widgetType: type
    });
  }

  widgetData(type: string) {
    return WidgetDisplayData()[this.widgetTypes[type]];
  }

  sourceData(type: string) {
    return SourceDisplayData()[type];
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
      this.selectSource('text_gdiplus', { propertiesManager: 'streamlabels' });
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
