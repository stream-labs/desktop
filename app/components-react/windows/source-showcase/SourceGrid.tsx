import React, { useMemo } from 'react';
import { Empty, Row, Col, PageHeader, Button } from 'antd';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { IObsListOption } from 'components/obs/inputs/ObsInput';
import { WidgetDisplayData, WidgetType } from 'services/widgets';
import { TSourceType } from 'services/sources';
import { getPlatformService } from 'services/platforms';
import { $i } from 'services/utils';
import { byOS, OS } from 'util/operating-systems';
import { $t } from 'services/i18n';
import SourceTag from './SourceTag';
import { useSourceShowcaseSettings } from './useSourceShowcase';

export default function SourceGrid(p: { activeTab: string }) {
  const {
    SourcesService,
    UserService,
    ScenesService,
    WindowsService,
    CustomizationService,
  } = Services;

  const { demoMode, designerMode, isLoggedIn, linkedPlatforms, primaryPlatform } = useVuex(() => ({
    demoMode: CustomizationService.views.isDarkTheme ? 'night' : 'day',
    designerMode: CustomizationService.views.designerMode,
    isLoggedIn: UserService.views.isLoggedIn,
    linkedPlatforms: UserService.views.linkedPlatforms,
    primaryPlatform: UserService.views.platform?.type,
  }));

  const { availableAppSources } = useSourceShowcaseSettings();

  const primaryPlatformService = UserService.state.auth
    ? getPlatformService(UserService.state.auth.primaryPlatform)
    : null;

  const iterableWidgetTypes = useMemo(
    () =>
      Object.keys(WidgetType)
        .filter((type: string) => isNaN(Number(type)) || type === 'SubscriberGoal')
        .filter((type: string) => {
          const widgetPlatforms = WidgetDisplayData(primaryPlatform)[WidgetType[type]].platforms;
          if (!widgetPlatforms) return true;
          return linkedPlatforms?.some(
            platform => widgetPlatforms && widgetPlatforms.has(platform),
          );
        })
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
      [
        'dshow_input',
        'ffmpeg_source',
        byOS({ [OS.Windows]: 'screen_capture', [OS.Mac]: 'window_capture' }),
      ].includes(source.value),
    );
    const essentialWidgets = iterableWidgetTypes.filter(type =>
      [WidgetType.AlertBox, WidgetType.EventList].includes(WidgetType[type]),
    );
    return { essentialDefaults, essentialWidgets };
  }, []);

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

  function filterEssential(source: IObsListOption<TSourceType> | string) {
    if (p.activeTab !== 'all') return true;
    if (typeof source === 'string') {
      return !essentialSources.essentialWidgets.find(s => s === source);
    }
    return !essentialSources.essentialDefaults.find(s => s.value === source.value);
  }

  return (
    <Scrollable style={{ height: 'calc(100% - 64px)' }}>
      <Row
        gutter={[8, 8]}
        style={{ marginLeft: '24px', marginRight: '24px', paddingBottom: '24px' }}
      >
        {showContent('all') && (
          <>
            <Col span={24}>
              <PageHeader style={{ paddingLeft: 0 }} title={$t('Essential Sources')} />
            </Col>
            {essentialSources.essentialDefaults.map(source => (
              <SourceTag key={source.value} type={source.value} essential />
            ))}
            {isLoggedIn &&
              essentialSources.essentialWidgets.map(widgetType => (
                <SourceTag key={widgetType} type={widgetType} essential />
              ))}
            {isLoggedIn && (
              <SourceTag key="streamlabel" name={$t('Stream Label')} type="streamlabel" essential />
            )}
          </>
        )}
        {showContent('general') && (
          <>
            <Col span={24}>
              <PageHeader style={{ paddingLeft: 0 }} title={$t('General Sources')} />
            </Col>
            {availableSources.filter(filterEssential).map(source => (
              <SourceTag key={source.value} type={source.value} />
            ))}
            <SourceTag key="replay" name={$t('Instant Replay')} type="replay" />
            {designerMode && (
              <SourceTag key="icon_library" name={$t('Custom Icon')} type={'icon_library'} />
            )}
          </>
        )}

        {showContent('widgets') && (
          <>
            <Col span={24}>
              <PageHeader style={{ paddingLeft: 0 }} title={$t('Widgets')} />
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
                {iterableWidgetTypes.filter(filterEssential).map(widgetType => (
                  <SourceTag key={widgetType} type={widgetType} />
                ))}
                {p.activeTab !== 'all' && (
                  <SourceTag key="streamlabel" name={$t('Stream Label')} type="streamlabel" />
                )}
              </>
            )}
          </>
        )}
        {showContent('apps') && (
          <>
            <Col span={24}>
              <PageHeader style={{ paddingLeft: 0 }} title={$t('Apps')} />
            </Col>
            {availableAppSources.map(app => (
              <SourceTag
                key={`${app.appId}${app.source.id}`}
                name={app.source.name}
                type="app_source"
                appId={app.appId}
                appSourceId={app.source.id}
              />
            ))}
          </>
        )}
      </Row>
    </Scrollable>
  );
}
