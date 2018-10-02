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
import { PlatformAppsService, IAppSource } from 'services/platform-apps'
import { omit } from 'lodash';

type TInspectableSource = TSourceType | WidgetType | 'streamlabel' | 'app_source';

interface ISelectSourceOptions {
  propertiesManager?: TPropertiesManager;
  widgetType?: WidgetType;
  appId?: string;
  appSourceId?: string;
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
  @Inject() platformAppsService: PlatformAppsService;

  widgetTypes = WidgetType;
  essentialWidgetTypes = new Set([this.widgetTypes.AlertBox]);

  iterableWidgetTypes = Object.keys(this.widgetTypes)
    .filter((type: string) => isNaN(Number(type)))
    .sort((a: string, b: string) => {
      return this.essentialWidgetTypes.has(this.widgetTypes[a]) ? -1 : 1;
    });


  selectSource(sourceType: TSourceType, options: ISelectSourceOptions = {}) {
    const managerType = options.propertiesManager || 'default';
    const propertiesManagerSettings: Dictionary<any> =
      { ...omit(options, 'propertiesManager') };

    this.sourcesService.showAddSource(sourceType, {
      propertiesManager: managerType,
      propertiesManagerSettings
    });
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

  selectAppSource(appId: string, appSourceId: string) {
    // TODO: Could be other source type
    this.selectSource('browser_source', {
      propertiesManager: 'platformApp',
      appId,
      appSourceId
    });
  }

  sourceData(type: string) {
    return SourceDisplayData()[type];
  }

  inspectedSource: TInspectableSource = null;
  inspectedAppId: string = '';
  inspectedAppSourceId: string = '';

  inspectSource(inspectedSource: TInspectableSource, appId?: string, appSourceId?: string) {
    this.inspectedSource = inspectedSource;
    if (appId) this.inspectedAppId = appId;
    if (appSourceId) this.inspectedAppSourceId = appSourceId;
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get platform() {
    if (!this.loggedIn) return null;
    return this.userService.platform.type;
  }

  widgetData(type: string) {
    return WidgetDisplayData(this.platform)[this.widgetTypes[type]];
  }

  selectInspectedSource() {
    if (this.sourcesService.getAvailableSourcesTypes().includes(this.inspectedSource as TSourceType)) {
      this.selectSource(this.inspectedSource as TSourceType);
    } else if (this.inspectedSource === 'streamlabel') {
      this.selectSource('text_gdiplus', { propertiesManager: 'streamlabels' });
    } else if (this.inspectedSource === 'app_source') {
      this.selectAppSource(this.inspectedAppId, this.inspectedAppSourceId);
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

  get availableAppSources(): {
    appId: string;
    source: IAppSource;
  }[] {
    return this.platformAppsService.state.loadedApps.reduce((sources, app) => {
      if (app.manifest.sources) {
        app.manifest.sources.forEach(source => {
          sources.push({
            appId: app.id,
            source
          });
        });
      }

      return sources;
    }, []);
  }

  getAppAssetUrl(appId: string, asset: string) {
    return this.platformAppsService.getAssetUrl(appId, asset);
  }

}
