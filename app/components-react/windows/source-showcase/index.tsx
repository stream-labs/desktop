import React, { useState, useMemo } from 'react';
import { Layout, Menu } from 'antd';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { SourceDisplayData } from 'services/sources';
import { WidgetDisplayData, WidgetType } from 'services/widgets';
import { $i } from 'services/utils';
import { $t } from 'services/i18n';
import { useSourceShowcaseSettings } from './useSourceShowcase';
import styles from './SourceShowcase.m.less';
import SourceGrid from './SourceGrid';

const { Content, Sider } = Layout;

export default function SourcesShowcase() {
  const { selectInspectedSource, availableAppSources } = useSourceShowcaseSettings();

  const [activeTab, setActiveTab] = useState('all');

  return (
    <ModalLayout
      onOk={selectInspectedSource}
      okText={$t('Add Source')}
      bodyStyle={{ paddingBottom: 0, paddingTop: 0 }}
    >
      <Layout style={{ height: '100%' }}>
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
            {availableAppSources.length > 0 && <Menu.Item key="apps">{$t('Apps')}</Menu.Item>}
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

  const appData = useMemo(() => {
    if (!inspectedAppId) return;
    const appManifest = PlatformAppsService.views.getApp(inspectedAppId).manifest;
    const source = appManifest.sources.find(source => source.id === inspectedAppSourceId);
    if (source) {
      return {
        supportList: source.about.bullets,
        description: source.about.description,
        demoFilename: source.about.bannerImage,
        demoVideo: false,
      };
    }
  }, [inspectedAppId]);

  function widgetData(type: string | WidgetType) {
    return WidgetDisplayData(platform)[WidgetType[type]];
  }

  const displayData =
    appData || widgetData(inspectedSource) || SourceDisplayData()[inspectedSource];

  const previewSrc = useMemo(() => {
    if (appData) {
      return PlatformAppsService.views.getAssetUrl(inspectedAppId, displayData?.demoFilename || '');
    }
    return $i(`source-demos/${demoMode}/${displayData?.demoFilename}`);
  }, [demoMode, displayData?.demoFilename]);

  return (
    <Sider
      width={300}
      style={{ marginRight: '-24px', height: '100%' }}
      collapsed={!displayData}
      collapsedWidth={0}
    >
      <div className={styles.preview}>
        {displayData?.demoFilename && (
          <div className={styles.imageContainer}>
            {displayData?.demoVideo && (
              <video autoPlay loop key={previewSrc}>
                <source src={previewSrc} />
              </video>
            )}
            {!displayData?.demoVideo && <img src={previewSrc} />}
          </div>
        )}
        <div>{displayData?.description}</div>
        {displayData?.supportList && <div className={styles.supportHeader}>{$t('Supports:')}</div>}
        <ul>
          {displayData?.supportList?.map(support => (
            <li key={support}>{support}</li>
          ))}
        </ul>
      </div>
    </Sider>
  );
}
