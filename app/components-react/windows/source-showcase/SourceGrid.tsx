import React, { useMemo } from 'react';
import { Empty, Row, Col, PageHeader, Button } from 'antd';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { WidgetDisplayData, WidgetType } from 'services/widgets';
import { IAppSource } from 'services/platform-apps';
import { getPlatformService } from 'services/platforms';
import { $i } from 'services/utils';
import { byOS, OS } from 'util/operating-systems';
import { $t } from 'services/i18n';
import SourceTag from './SourceTag';

export default function SourceGrid(p: { activeTab: string }) {
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

  const essentialSources = useMemo(() => {
    const essentialDefaults = availableSources.filter(source =>
      ['dshow_input', byOS({ [OS.Windows]: 'screen_capture', [OS.Mac]: 'ffmpeg_source' })].includes(
        source.value,
      ),
    );
    const essentialWidgets = iterableWidgetTypes.filter(type =>
      [WidgetType.AlertBox, WidgetType.EventList].includes(WidgetType[type]),
    );
    return { essentialDefaults, essentialWidgets };
  }, []);

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
    if (UserService.state.auth?.primaryPlatform === 'tiktok' && key === 'widgets') return false;
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
        {showContent('all') && (
          <>
            <Col span={24}>
              <PageHeader title={$t('Essential Sources')} />
            </Col>
            {essentialSources.essentialDefaults.map(source => (
              <SourceTag key={source.value} name={source.description} type={source.value} />
            ))}
            {essentialSources.essentialWidgets.map(widgetType => (
              <SourceTag
                key={widgetType}
                name={WidgetDisplayData()[WidgetType[widgetType]].name}
                type={widgetType}
              />
            ))}
            <SourceTag key="streamlabel" name={$t('Streamlabel')} type="streamlabel" />
          </>
        )}
        {showContent('general') && (
          <>
            <Col span={24}>
              <PageHeader title={$t('General Sources')} />
            </Col>
            {availableSources.map(source => (
              <SourceTag key={source.value} name={source.description} type={source.value} />
            ))}
            {designerMode && (
              <SourceTag key="icon_library" name={$t('Custom Icon')} type={'icon_library'} />
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
                    type={widgetType}
                  />
                ))}
                <SourceTag key="streamlabel" name={$t('Streamlabel')} type="streamlabel" />
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
                type="app_source"
                appId={app.appId}
              />
            ))}
          </>
        )}
      </Row>
    </Scrollable>
  );
}
