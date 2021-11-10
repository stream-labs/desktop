import React, { useState, useMemo } from 'react';
import { Layout, Menu, Empty, Row, Col, PageHeader, Button } from 'antd';
import Scrollable from 'components-react/shared/Scrollable';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { SourceDisplayData, TSourceType } from 'services/sources';
import { WidgetDisplayData, WidgetType } from 'services/widgets';
import { IAppSource } from 'services/platform-apps';
import { getPlatformService } from 'services/platforms';
import { $i } from 'services/utils';
import { byOS, OS } from 'util/operating-systems';
import { $t } from 'services/i18n';
import { useSourceShowcaseSettings } from './useSourceShowcase';
import styles from './SourceShowcase.m.less';

const { Content, Sider } = Layout;

export default function SourcesShowcase() {
  const { inspectedSource, selectInspectedSource } = useSourceShowcaseSettings();

  const [activeTab, setActiveTab] = useState('all');

  return (
    <ModalLayout onOk={selectInspectedSource}>
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
          <SourceGrid activeTab={activeTab} />
        </Content>
        <SideBar />
      </Layout>
    </ModalLayout>
  );
}

function SideBar() {
  const { UserService, CustomizationService, PlatformAppsService } = Services;
  const { inspectedSource, inspectedAppId, inspectedAppSourceId } = useSourceShowcaseSettings();

  const { demoMode, platform } = useVuex(() => ({
    demoMode: CustomizationService.views.isDarkTheme ? 'night' : 'day',
    platform: UserService.views.platform?.type,
  }));

  const displayData = widgetData(inspectedSource)
    ? widgetData(inspectedSource)
    : SourceDisplayData()[inspectedSource];

  function widgetData(type: string | WidgetType) {
    return WidgetDisplayData(platform)[WidgetType[type]];
  }

  function getSrc() {
    if (inspectedAppId) {
      const appManifest = PlatformAppsService.views.getApp(inspectedAppId).manifest;
      const source = appManifest.sources.find(source => source.id === inspectedAppSourceId);
      if (source) {
        return PlatformAppsService.views.getAssetUrl(
          inspectedAppId,
          source.about?.bannerImage || '',
        );
      }
    }
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

function SourceGrid(p: { activeTab: string }) {
  const {
    inspectSource,
    selectSource,
    selectWidget,
    selectStreamlabel,
    selectAppSource,
  } = useSourceShowcaseSettings();

  const essentialSources = new Set([WidgetType.AlertBox]);

  const {
    SourcesService,
    UserService,
    ScenesService,
    WindowsService,
    PlatformAppsService,
    CustomizationService,
  } = Services;

  const { demoMode, designerMode, isLoggedIn, enabledApps } = useVuex(() => ({
    demoMode: CustomizationService.views.isDarkTheme ? 'night' : 'day',
    designerMode: CustomizationService.views.designerMode,
    isLoggedIn: UserService.views.isLoggedIn,
    enabledApps: PlatformAppsService.views.enabledApps,
  }));

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
    const correctKey = ['all', key].includes(p.activeTab);
    if (key === 'apps') {
      return correctKey && availableAppSources.length > 0;
    }
    return correctKey;
  }

  function handleAuth() {
    WindowsService.closeChildWindow();
    UserService.showLogin();
  }

  return (
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
                onDoubleClick={() => selectSource(source.value)}
              />
            ))}
            {designerMode && (
              <SourceTag
                key="icon_library"
                name={$t('Custom Icon')}
                onClick={() => inspectSource('icon_library')}
                onDoubleClick={() =>
                  selectSource('image_source', { propertiesManager: 'iconLibrary' })
                }
              />
            )}
          </>
        )}

        {showContent('widgets') && (
          <>
            <Col span={24}>
              <PageHeader title={$t('Widgets')} />
            </Col>
            {!isLoggedIn ? (
              <Empty
                description={$t('You must be logged in to use Widgets')}
                image={$i(`images/sleeping-kevin-${demoMode}.png`)}
              >
                <Button onClick={handleAuth}>{$t('Click here to log in')}</Button>
              </Empty>
            ) : (
              <>
                {iterableWidgetTypes.map(widgetType => (
                  <SourceTag
                    key={widgetType}
                    name={WidgetDisplayData()[WidgetType[widgetType]].name}
                    onClick={() => inspectSource(widgetType)}
                    onDoubleClick={() => selectWidget(WidgetType[widgetType])}
                  />
                ))}
                {hasStreamlabel && (
                  <SourceTag
                    key="streamlabels"
                    name={$t('Streamlabel')}
                    onClick={() => inspectSource('streamlabels')}
                    onDoubleClick={() => selectStreamlabel()}
                  />
                )}
              </>
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
                onDoubleClick={() => selectAppSource(app.appId, app.source.id)}
              />
            ))}
          </>
        )}
      </Row>
    </Scrollable>
  );
}

function SourceTag(p: { name: string; onClick: () => void; onDoubleClick: () => void }) {
  return (
    <Col span={8}>
      <div className={styles.sourceTag} onClick={p.onClick} onDoubleClick={p.onDoubleClick}>
        {p.name}
      </div>
    </Col>
  );
}
