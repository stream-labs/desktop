import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import ModalLayout from 'components/ModalLayout.vue';
import { WindowsService } from 'services/windows';
import AddSourceInfo from './AddSourceInfo.vue';
import {
  SourcesService,
  TSourceType,
  TPropertiesManager,
  SourceDisplayData,
} from 'services/sources';
import { ScenesService } from 'services/scenes';
import { UserService } from 'services/user';
import { WidgetsService, WidgetType, WidgetDisplayData } from 'services/widgets';
import { PlatformAppsService, IAppSource } from 'services/platform-apps';
import { omit } from 'lodash';
import { PrefabsService } from '../../services/prefabs';

type TInspectableSource = TSourceType | WidgetType | 'streamlabel' | 'app_source' | string;

interface ISelectSourceOptions {
  propertiesManager?: TPropertiesManager;
  widgetType?: WidgetType;
  appId?: string;
  appSourceId?: string;
}

interface ISourceDefinition {
  id: string;
  type: TInspectableSource;
  name: string;
  description: string;
  prefabId?: string; // if is defined than the source wil be created from the prefab
}

@Component({
  components: {
    ModalLayout,
    AddSourceInfo,
  },
})
export default class SourcesShowcase extends Vue {
  @Inject() sourcesService: SourcesService;
  @Inject() userService: UserService;
  @Inject() widgetsService: WidgetsService;
  @Inject() scenesService: ScenesService;
  @Inject() windowsService: WindowsService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() prefabsService: PrefabsService;

  widgetTypes = WidgetType;
  essentialWidgetTypes = new Set([this.widgetTypes.AlertBox]);

  iterableWidgetTypes = Object.keys(this.widgetTypes)
    .filter((type: string) => isNaN(Number(type)))
    .sort((a: string, b: string) => {
      return this.essentialWidgetTypes.has(this.widgetTypes[a]) ? -1 : 1;
    });

  selectSource(sourceType: TSourceType, options: ISelectSourceOptions = {}) {
    const managerType = options.propertiesManager || 'default';
    const propertiesManagerSettings: Dictionary<any> = { ...omit(options, 'propertiesManager') };

    this.sourcesService.showAddSource(sourceType, {
      propertiesManagerSettings,
      propertiesManager: managerType,
    });
  }

  selectPrefab(prefabId: string) {
    this.prefabsService.getPrefab(prefabId).addToScene(this.scenesService.activeSceneId);
    this.windowsService.closeChildWindow();
  }

  getSrc(type: string, theme: string) {
    const dataSource = this.widgetData(type) ? this.widgetData : this.sourceData;
    return require(`../../../media/source-demos/${theme}/${dataSource(type).demoFilename}`);
  }

  selectWidget(type: WidgetType) {
    this.selectSource('browser_source', {
      propertiesManager: 'widget',
      widgetType: type,
    });
  }

  selectAppSource(appId: string, appSourceId: string) {
    // TODO: Could be other source type
    this.selectSource('browser_source', {
      appId,
      appSourceId,
      propertiesManager: 'platformApp',
    });
  }

  sourceData(type: string) {
    return SourceDisplayData()[type];
  }

  inspectedSource: string = null;
  inspectedSourceType: TInspectableSource = null;
  inspectedAppId: string = '';
  inspectedAppSourceId: string = '';

  inspectSource(inspectedSource: string, appId?: string, appSourceId?: string) {
    this.inspectedSource = this.inspectedSourceType = inspectedSource;
    const prefab = this.prefabsService.getPrefab(inspectedSource);
    if (prefab) this.inspectedSourceType = prefab.getPrefabSourceModel().type;
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
    if (this.prefabsService.getPrefab(this.inspectedSource)) {
      this.selectPrefab(this.inspectedSource);
    } else if (
      this.sourcesService.getAvailableSourcesTypes().includes(this.inspectedSource as TSourceType)
    ) {
      this.selectSource(this.inspectedSource as TSourceType);
    } else if (this.inspectedSource === 'streamlabel') {
      this.selectSource('text_gdiplus', { propertiesManager: 'streamlabels' });
    } else if (this.inspectedSource === 'replay') {
      this.selectSource('ffmpeg_source', { propertiesManager: 'replay' });
    } else if (this.inspectedSource === 'app_source') {
      this.selectAppSource(this.inspectedAppId, this.inspectedAppSourceId);
    } else {
      this.selectWidget(this.inspectedSourceType as WidgetType);
    }
  }

  get availableSources(): ISourceDefinition[] {
    const sourcesList: ISourceDefinition[] = this.sourcesService
      .getAvailableSourcesTypesList()
      .filter(type => {
        if (type.value === 'text_ft2_source') return false;
        if (type.value === 'scene' && this.scenesService.scenes.length <= 1) return false;
        return true;
      })
      .map(listItem => {
        return {
          id: listItem.value,
          type: listItem.value,
          name: this.sourceData(listItem.value).name,
          description: this.sourceData(listItem.value).description,
        };
      });

    this.prefabsService.getPrefabs().forEach(prefab => {
      const prefabSourceModel = prefab.getPrefabSourceModel();
      if (!prefabSourceModel) return;
      sourcesList.push({
        id: prefab.id,
        type: prefabSourceModel.type,
        name: prefab.name,
        description: prefab.description,
        prefabId: prefab.id,
      });
    });

    return sourcesList;
  }

  get inspectedSourceDefinition() {
    return this.availableSources.find(source => source.id === this.inspectedSource);
  }

  get availableAppSources(): {
    appId: string;
    source: IAppSource;
  }[] {
    return this.platformAppsService.enabledApps.reduce((sources, app) => {
      if (app.manifest.sources) {
        app.manifest.sources.forEach(source => {
          sources.push({
            source,
            appId: app.id,
          });
        });
      }

      return sources;
    }, []);
  }

  get showAppSources() {
    return this.availableAppSources.length > 0;
  }

  getAppAssetUrl(appId: string, asset: string) {
    return this.platformAppsService.getAssetUrl(appId, asset);
  }
}
