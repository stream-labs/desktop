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
import { byOS, getOS, OS } from 'util/operating-systems';
import { $t, I18nService } from 'services/i18n';
import SourceTag from './SourceTag';
import { useSourceShowcaseSettings } from './useSourceShowcase';
import { EAvailableFeatures } from 'services/incremental-rollout';
import { useRealmObject } from 'components-react/hooks/realm';

export default function SourceGrid(p: { activeTab: string }) {
  const {
    SourcesService,
    UserService,
    ScenesService,
    WindowsService,
    CustomizationService,
    IncrementalRolloutService,
  } = Services;

  const { isLoggedIn, linkedPlatforms, primaryPlatform } = useVuex(() => ({
    isLoggedIn: UserService.views.isLoggedIn,
    linkedPlatforms: UserService.views.linkedPlatforms,
    primaryPlatform: UserService.views.platform?.type,
  }));

  const customization = useRealmObject(CustomizationService.state);
  const demoMode = customization.isDarkTheme ? 'night' : 'day';
  const designerMode = customization.designerMode;

  /**
   * English and languages with logographic writing systems
   * generally have shorter strings so we prevent those cards from wrapping.
   */

  const i18nService = I18nService.instance as I18nService;
  const locale = i18nService.state.locale;
  const excludedLanguages = ['en', 'ko', 'zh']; // add i18n prefixes here to exclude languages from wrapping
  const excludeWrap = excludedLanguages.includes(locale.split('-')[0]);

  const { availableAppSources } = useSourceShowcaseSettings();

  const primaryPlatformService = UserService.state.auth
    ? getPlatformService(UserService.state.auth.primaryPlatform)
    : null;

  const iterableWidgetTypes = useMemo(
    () =>
      Object.keys(WidgetType)
        .filter((type: string) => isNaN(Number(type)) && type !== 'SubscriberGoal')
        .filter((type: string) => {
          // TODO: index
          // @ts-ignore
          const widgetPlatforms = WidgetDisplayData(primaryPlatform)[WidgetType[type]]?.platforms;
          if (!widgetPlatforms) return true;
          return linkedPlatforms?.some(
            platform => widgetPlatforms && widgetPlatforms.has(platform),
          );
        })
        .filter(type => {
          // show only supported widgets
          const whitelist = primaryPlatformService?.widgetsWhitelist;
          if (!whitelist) return true;
          // TODO: index
          // @ts-ignore
          return whitelist.includes(WidgetType[type]);
        }),
    [],
  );

  const availableSources = useMemo(() => {
    const guestCamAvailable =
      (IncrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.guestCamBeta) ||
        IncrementalRolloutService.views.featureIsEnabled(EAvailableFeatures.guestCamProduction)) &&
      UserService.views.isLoggedIn;

    return SourcesService.getAvailableSourcesTypesList().filter(type => {
      // Freetype on windows is hidden
      if (type.value === 'text_ft2_source' && byOS({ [OS.Windows]: true, [OS.Mac]: false })) {
        return;
      }

      if (type.value === 'mediasoupconnector' && !guestCamAvailable) {
        return false;
      }

      return !(type.value === 'scene' && ScenesService.views.scenes.length <= 1);
    });
  }, []);

  const essentialSources = useMemo(() => {
    const essentialDefaults = availableSources.filter(source =>
      [
        'dshow_input',
        'ffmpeg_source',
        byOS({ [OS.Windows]: 'screen_capture', [OS.Mac]: 'window_capture' }),
      ].includes(source.value),
    );
    const essentialWidgets = iterableWidgetTypes.filter(type =>
      // TODO: index
      // @ts-ignore
      [WidgetType.AlertBox, WidgetType.EventList].includes(WidgetType[type]),
    );
    return { essentialDefaults, essentialWidgets };
  }, []);

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
              <SourceTag
                key={source.value}
                type={source.value}
                essential
                excludeWrap={excludeWrap}
              />
            ))}
            {isLoggedIn &&
              essentialSources.essentialWidgets.map(widgetType => (
                <SourceTag key={widgetType} type={widgetType} essential excludeWrap={excludeWrap} />
              ))}
            {isLoggedIn && (
              <SourceTag
                key="streamlabel"
                name={$t('Stream Label')}
                type="streamlabel"
                essential
                excludeWrap={excludeWrap}
              />
            )}
          </>
        )}
        {showContent('general') && (
          <>
            <Col span={24}>
              <PageHeader style={{ paddingLeft: 0 }} title={$t('General Sources')} />
            </Col>
            {availableSources.filter(filterEssential).map(source => (
              <SourceTag key={source.value} type={source.value} excludeWrap={excludeWrap} />
            ))}
            <SourceTag
              key="replay"
              name={$t('Instant Replay')}
              type="replay"
              excludeWrap={excludeWrap}
            />
            {designerMode && (
              <SourceTag
                key="icon_library"
                name={$t('Custom Icon')}
                type={'icon_library'}
                excludeWrap={excludeWrap}
              />
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
                  <SourceTag key={widgetType} type={widgetType} excludeWrap={excludeWrap} />
                ))}
                {p.activeTab !== 'all' && (
                  <SourceTag
                    key="streamlabel"
                    name={$t('Stream Label')}
                    type="streamlabel"
                    excludeWrap={excludeWrap}
                  />
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
                excludeWrap={excludeWrap}
              />
            ))}
          </>
        )}
      </Row>
    </Scrollable>
  );
}
