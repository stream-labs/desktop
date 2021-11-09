import React, { useState, useMemo } from 'react';
import { Layout, Menu, Empty, Row, Col, PageHeader } from 'antd';
import omit from 'lodash/omit';
import { Services } from 'components-react/service-provider';
import Scrollable from 'components-react/shared/Scrollable';
import { useVuex } from 'components-react/hooks';
import { SourceDisplayData, TPropertiesManager, TSourceType } from 'services/sources';
import { WidgetDisplayData, WidgetType } from 'services/widgets';
import { IAppSource } from 'services/platform-apps';
import { getPlatformService } from 'services/platforms';
import { $i } from 'services/utils';
import { byOS, OS } from 'util/operating-systems';
import { $t } from 'services/i18n';
import { ModalLayout } from 'components-react/shared/ModalLayout';

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
    ScenesService,
    WindowsService,
    PlatformAppsService,
    CustomizationService,
  } = Services;

  const essentialSources = new Set([WidgetType.AlertBox]);
  const primaryPlatformService = UserService.state.auth
    ? getPlatformService(UserService.state.auth.primaryPlatform)
    : null;
  const hasStreamlabel = primaryPlatformService?.hasCapability('streamlabels');

  const iterableWidgetTypes = useMemo(
    () =>
      Object.keys(WidgetType)
        .filter((type: string) => isNaN(Number(type)))
        .filter(type => {
          // show only supported widgets
          const whitelist = primaryPlatformService?.widgetsWhitelist;
          if (!whitelist) return true;
          return whitelist.includes(WidgetType[type]);
        }),
    [],
  );

  const [activeTab, setActiveTab] = useState('all');

  const { demoMode, designerMode, platform, isLoggedIn, enabledApps } = useVuex(() => ({
    demoMode: CustomizationService.views.isDarkTheme ? 'night' : 'day',
    designerMode: CustomizationService.views.designerMode,
    platform: UserService.views.platform?.type,
    isLoggedIn: UserService.views.isLoggedIn,
    enabledApps: PlatformAppsService.views.enabledApps,
  }));

  function selectSource(sourceType: TSourceType, options: ISelectSourceOptions = {}) {
    const managerType = options.propertiesManager || 'default';
    const propertiesManagerSettings: Dictionary<any> = { ...omit(options, 'propertiesManager') };

    SourcesService.showAddSource(sourceType, {
      propertiesManagerSettings,
      propertiesManager: managerType,
    });
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

  const [inspectedSource, setInspectedSource] = useState('' as TInspectableSource);
  const [inspectedAppId, setInspectedAppId] = useState('');
  const [inspectedAppSourceId, setInspectedAppSourceId] = useState('');

  function inspectSource(source: string, appId?: string, appSourceId?: string) {
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
      selectWidget(inspectedSource as WidgetType);
    }
  }

  function selectStreamlabel() {
    selectSource(byOS({ [OS.Windows]: 'text_gdiplus', [OS.Mac]: 'text_ft2_source' }), {
      propertiesManager: 'streamlabels',
    });
  }

  const availableSources = useMemo(
    () =>
      SourcesService.getAvailableSourcesTypesList().filter(type => {
        // Freetype on windows is hidden
        if (type.value === 'text_ft2_source' && byOS({ [OS.Windows]: true, [OS.Mac]: false })) {
          return;
        }
        return !(type.value === 'scene' && ScenesService.views.scenes.length <= 1);
      }),
    [],
  );

  const availableAppSources = useMemo(
    () =>
      enabledApps.reduce<{ source: IAppSource; appId: string }[]>((sources, app) => {
        if (app.manifest.sources) {
          app.manifest.sources.forEach(source => {
            sources.push({ source, appId: app.id });
          });
        }

        return sources;
      }, []),
    [],
  );

  function showContent(key: string) {
    const correctKey = ['all', key].includes(activeTab);
    if (key === 'apps') {
      return correctKey && availableAppSources.length > 0;
    }
    return correctKey;
  }

  function getAppAssetUrl(appId: string, asset: string) {
    return PlatformAppsService.views.getAssetUrl(appId, asset);
  }

  function handleAuth() {
    WindowsService.closeChildWindow();
    UserService.showLogin();
  }

  return (
    <ModalLayout>
      <Layout style={{ height: 'calc(100% - 53px)' }}>
        <Content>
          <Menu
            onClick={e => setActiveTab(e.key)}
            selectedKeys={[activeTab]}
            mode="horizontal"
            style={{ marginBottom: '16px' }}
          >
            <Menu.Item key="all">{$t('All')}</Menu.Item>
            <Menu.Item key="general">{$t('General')}</Menu.Item>
            <Menu.Item key="widgets">{$t('Widgets')}</Menu.Item>
            <Menu.Item key="apps">{$t('Apps')}</Menu.Item>
          </Menu>
          <Scrollable style={{ height: '100%' }}>
            <Row gutter={[8, 8]}>
              {showContent('general') && (
                <>
                  <Col span={24}>
                    <PageHeader title={$t('General Sources')} />
                  </Col>
                  {availableSources.map(source => (
                    <SourceTag
                      key={source.value}
                      name={source.description}
                      onClick={() => inspectSource(source.value)}
                    />
                  ))}
                </>
              )}

              {showContent('widgets') && (
                <>
                  <Col span={24}>
                    <PageHeader title={$t('Widgets')} />
                  </Col>
                  {!isLoggedIn ? (
                    <Empty
                      image={require(`../../../media/images/sleeping-kevin-${demoMode}.png`)}
                    />
                  ) : (
                    iterableWidgetTypes.map(widgetType => (
                      <SourceTag
                        key={widgetType}
                        name={WidgetDisplayData()[WidgetType[widgetType]].name}
                        onClick={() => inspectSource(widgetType)}
                      />
                    ))
                  )}
                </>
              )}
              {showContent('apps') && (
                <>
                  <Col span={24}>
                    <PageHeader title={$t('Apps')} />
                  </Col>
                  {availableAppSources.map(app => (
                    <SourceTag
                      key={app.appId}
                      name={app.source.name}
                      onClick={() => inspectSource(app.source.type, app.appId)}
                    />
                  ))}
                </>
              )}
            </Row>
          </Scrollable>
        </Content>
        <SideBar inspectedSource={inspectedSource} />
      </Layout>
    </ModalLayout>
  );
}

function SideBar(p: { inspectedSource: string | WidgetType }) {
  const { UserService, CustomizationService } = Services;

  const { demoMode, platform } = useVuex(() => ({
    demoMode: CustomizationService.views.isDarkTheme ? 'night' : 'day',
    platform: UserService.views.platform?.type,
  }));

  const displayData = widgetData(p.inspectedSource)
    ? widgetData(p.inspectedSource)
    : SourceDisplayData()[p.inspectedSource];

  function widgetData(type: string | WidgetType) {
    return WidgetDisplayData(platform)[WidgetType[type]];
  }

  function getSrc() {
    return $i(`source-demos/${demoMode}/${displayData?.demoFilename}`);
  }

  return (
    <Sider width={300}>
      <div>
        {displayData?.demoVideo && (
          <video autoPlay loop>
            <source src={getSrc()} />
          </video>
        )}
        {!displayData?.demoVideo && <img src={getSrc()} />}
      </div>
    </Sider>
  );
}

function SourceTag(p: { name: string; onClick: () => void }) {
  const tagStyle: React.CSSProperties = {
    background: 'var(--section-alt)',
    borderRadius: '4px',
    height: '32px',
    paddingTop: '6px',
    paddingLeft: '16px',
    paddingRight: '8px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  };
  return (
    <Col span={8}>
      <div style={tagStyle} onClick={p.onClick}>
        {p.name}
      </div>
    </Col>
  );
}
