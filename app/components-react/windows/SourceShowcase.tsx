import React, { useState } from 'react';
import { Services } from 'components-react/service-provider';
import { SourceDisplayData, TPropertiesManager, TSourceType } from 'services/sources';
import { WidgetDisplayData, WidgetsService, WidgetType } from 'services/widgets';
import { IAppSource, PlatformAppsService } from 'services/platform-apps';
import omit from 'lodash/omit';
import { byOS, OS } from 'util/operating-systems';
import Scrollable from 'components-react/shared/Scrollable';
import { getPlatformService } from '../../services/platforms';
import { $i } from 'services/utils';
import { useVuex } from 'components-react/hooks';
import { Layout } from 'antd';

const { Content, Sider } = Layout;

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
}

export default function SourcesShowcase() {
  const {
    SourcesService,
    UserService,
    WidgetsService,
    ScenesService,
    WindowsService,
    PlatformAppsService,
    CustomizationService,
  } = Services;

  const widgetTypes = WidgetType;
  const essentialWidgetTypes = new Set([widgetTypes.AlertBox]);
  const primaryPlatformService = UserService.state.auth
    ? getPlatformService(UserService.state.auth.primaryPlatform)
    : null;
  const hasStreamlabel = primaryPlatformService?.hasCapability('streamlabels');

  const iterableWidgetTypes = Object.keys(widgetTypes)
    .filter((type: string) => isNaN(Number(type)))
    .filter(type => {
      // show only supported widgets
      const whitelist = primaryPlatformService?.widgetsWhitelist;
      if (!whitelist) return true;
      return whitelist.includes(WidgetType[type]);
    })
    .sort((a: string, b: string) => {
      return essentialWidgetTypes.has(widgetTypes[a]) ? -1 : 1;
    });

  const { demoMode, designerMode, platform, isLoggedIn, enabledApps } = useVuex(() => ({
    demoMode: CustomizationService.views.isDarkTheme ? 'night' : 'day',
    designerMode: CustomizationService.views.designerMode,
    platform: UserService.views.platform?.type,
    isLoggedIn: UserService.views.isLoggedIn,
    enabledApps: PlatformAppsService.views.enabledApps,
  }));

  function widgetData(type: string) {
    return WidgetDisplayData(platform)[widgetTypes[type]];
  }

  function selectSource(sourceType: TSourceType, options: ISelectSourceOptions = {}) {
    const managerType = options.propertiesManager || 'default';
    const propertiesManagerSettings: Dictionary<any> = { ...omit(options, 'propertiesManager') };

    SourcesService.showAddSource(sourceType, {
      propertiesManagerSettings,
      propertiesManager: managerType,
    });
  }

  function getSrc(type: string) {
    const dataSource = widgetData(type) ? widgetData : sourceData;
    return $i(`source-demos/${demoMode}/${dataSource(type).demoFilename}`);
  }

  function getLoginSrc() {
    return require(`../../../media/images/sleeping-kevin-${demoMode}.png`);
  }

  function selectWidget(type: WidgetType) {
    selectSource('browser_source', {
      propertiesManager: 'widget',
      widgetType: type,
    });
  }

  function selectAppSource(appId: string, appSourceId: string) {
    // TODO: Could be other source type
    selectSource('browser_source', {
      appId,
      appSourceId,
      propertiesManager: 'platformApp',
    });
  }

  const [inspectedSource, setInspectedSource] = useState('');
  const [inspectedSourceType, setInspectedSourceType] = useState('' as TInspectableSource);
  const [inspectedAppId, setInspectedAppId] = useState('');
  const [inspectedAppSourceId, setInspectedAppSourceId] = useState('');

  function inspectSource(source: string, appId?: string, appSourceId?: string) {
    setInspectedSourceType(source);
    setInspectedSource(source);
    if (appId) setInspectedAppId(appId);
    if (appSourceId) setInspectedAppSourceId(appSourceId);
  }

  function selectInspectedSource() {
    if (SourcesService.getAvailableSourcesTypes().includes(inspectedSource as TSourceType)) {
      selectSource(inspectedSource as TSourceType);
    } else if (inspectedSource === 'streamlabel') {
      selectStreamlabel();
    } else if (inspectedSource === 'replay') {
      selectSource('ffmpeg_source', { propertiesManager: 'replay' });
    } else if (inspectedSource === 'icon_library') {
      selectSource('image_source', { propertiesManager: 'iconLibrary' });
    } else if (inspectedSource === 'app_source') {
      selectAppSource(inspectedAppId, inspectedAppSourceId);
    } else {
      selectWidget(inspectedSourceType as WidgetType);
    }
  }

  function selectStreamlabel() {
    selectSource(byOS({ [OS.Windows]: 'text_gdiplus', [OS.Mac]: 'text_ft2_source' }), {
      propertiesManager: 'streamlabels',
    });
  }
  function availableSources(): ISourceDefinition[] {
    const sourcesList: ISourceDefinition[] = SourcesService.getAvailableSourcesTypesList()
      .filter(type => {
        // Freetype on windows is hidden
        if (type.value === 'text_ft2_source' && byOS({ [OS.Windows]: true, [OS.Mac]: false })) {
          return;
        }
        return !(type.value === 'scene' && ScenesService.views.scenes.length <= 1);
      })
      .map(listItem => {
        return {
          id: listItem.value,
          type: listItem.value,
          name: sourceData(listItem.value).name,
          description: sourceData(listItem.value).description,
        };
      });

    return sourcesList;
  }

  function inspectedSourceDefinition() {
    return availableSources().find(source => source.id === inspectedSource);
  }

  function availableAppSources(): {
    appId: string;
    source: IAppSource;
  }[] {
    return enabledApps.reduce((sources, app) => {
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

  function showAppSources() {
    return availableAppSources().length > 0;
  }

  function getAppAssetUrl(appId: string, asset: string) {
    return PlatformAppsService.views.getAssetUrl(appId, asset);
  }

  function handleAuth() {
    WindowsService.closeChildWindow();
    UserService.showLogin();
  }

  return (
    <Layout>
      <Content></Content>
      <SideBar inspectedSourceType={inspectedSourceType} />
    </Layout>
  );
}

function SideBar(p: { inspectedSourceType: string | WidgetType }) {
  const sourceData = SourceDisplayData()[p.inspectedSourceType];

  return (
    <Sider>
      <h2>{{ name }}</h2>
      <div class="desc">{{ description }}</div>

      <div class="source-support" v-if="showSupport">
        <slot name="support-list"></slot>
      </div>

      <div class="source-info__media">
        <slot name="media"></slot>
      </div>
    </Sider>
  );
}
