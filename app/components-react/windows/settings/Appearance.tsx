import React, { useMemo } from 'react';
import { Services } from '../../service-provider';
import { $t } from '../../../services/i18n';
import { Row, Col } from 'antd';
import { CheckboxInput, ListInput, SliderInput, SwitchInput } from '../../shared/inputs';
import { getDefined } from '../../../util/properties-type-guards';
import { ObsSettingsSection } from './ObsSettings';
import * as remote from '@electron/remote';
import { injectFormBinding, useModule } from 'slap';
import { ENavName, EMenuItem, IMenuItem, IParentMenuItem, TMenuItems } from 'services/side-nav';
import { useVuex } from 'components-react/hooks';
import styles from './Appearance.m.less';
import cx from 'classnames';

export function AppearanceSettings() {
  const {
    CustomizationService,
    WindowsService,
    UserService,
    MagicLinkService,
    SideNavService,
  } = Services;

  const { bind } = useModule(() => {
    function getSettings() {
      return CustomizationService.state;
    }

    function setSettings(newSettings: typeof CustomizationService.state) {
      CustomizationService.actions.setSettings(newSettings);
    }

    return { bind: injectFormBinding(getSettings, setSettings) };
  });

  const { compactView, menuItems } = useVuex(() => ({
    compactView: SideNavService.views.compactView,
    views: SideNavService.views,
    menuItems: SideNavService.views.menuItems,
  }));

  console.log('APPEARANCE COMPONENT: menuItems ', menuItems);

  function openFFZSettings() {
    WindowsService.createOneOffWindow(
      {
        componentName: 'FFZSettings',
        title: $t('FrankerFaceZ Settings'),
        queryParams: {},
        size: {
          width: 800,
          height: 800,
        },
      },
      'ffz-settings',
    );
  }

  async function upgradeToPrime() {
    const link = await MagicLinkService.getDashboardMagicLink('prime-marketing', 'slobs-ui-themes');
    remote.shell.openExternal(link);
  }

  const shouldShowPrime = UserService.views.isLoggedIn && !UserService.views.isPrime;
  const shouldShowEmoteSettings =
    UserService.views.isLoggedIn && getDefined(UserService.platform).type === 'twitch';

  return (
    <div>
      <ObsSettingsSection>
        <ListInput {...bind.theme} label={'Theme'} options={CustomizationService.themeOptions} />
        {shouldShowPrime && (
          <div style={{ marginBottom: '16px' }}>
            <a style={{ color: 'var(--prime)' }} onClick={upgradeToPrime}>
              <i style={{ color: 'var(--prime)' }} className="icon-prime" />
              {$t('Change the look of Streamlabs Desktop with Prime')}
            </a>
          </div>
        )}
      </ObsSettingsSection>

      <ObsSettingsSection title={$t('Chat Settings')}>
        {/* TODO: Will this conflict with the new menu? */}
        <CheckboxInput
          {...bind.leftDock}
          label={$t('Show the live dock (chat) on the left side')}
        />
        <SliderInput
          {...bind.chatZoomFactor}
          label={$t('Text Size')}
          tipFormatter={(val: number) => `${val * 100}%`}
          min={0.25}
          max={2}
          step={0.25}
        />

        {shouldShowEmoteSettings && (
          <div>
            <CheckboxInput
              {...bind.enableBTTVEmotes}
              label={$t('Enable BetterTTV emotes for Twitch')}
            />
            <CheckboxInput
              {...bind.enableFFZEmotes}
              label={$t('Enable FrankerFaceZ emotes for Twitch')}
            />
          </div>
        )}
      </ObsSettingsSection>

      <ObsSettingsSection title={$t('Custom Navigation Bar')}>
        <CheckboxInput
          onChange={() => SideNavService.actions.setCompactView()}
          label={$t(
            'Enable custom navigation bar to pin your favorite features for quick access.\nDisable to swap to compact view.',
          )}
          value={compactView}
          className={cx(styles.settingsCheckbox)}
          // style={{
          //   backgroundColor: compactView ? 'var(--checkbox)' : 'var(--teal_',
          //   borderColor: compactView ? 'var(--checkbox)' : 'var(--teal)',
          // }}
        />
        <Row gutter={[8, 8]}>
          <Col flex={1}>
            <SwitchInput
              label={$t(EMenuItem.Editor)}
              layout="horizontal"
              onChange={() =>
                SideNavService.actions.toggleMenuItem(ENavName.TopNav, EMenuItem.Editor)
              }
              value={menuItems[EMenuItem.Editor].isActive}
              // className={}
            />
            <SwitchInput
              label={$t('Custom Editor')}
              layout="horizontal"
              onChange={() =>
                SideNavService.actions.toggleMenuItem(ENavName.TopNav, EMenuItem.Highlighter)
              }
              value={menuItems[EMenuItem.Highlighter].isActive} // what value? Highlighter temporarily
              // className={}
            />
            <SwitchInput
              label={$t(EMenuItem.StudioMode)}
              layout="horizontal"
              onChange={() =>
                SideNavService.actions.toggleMenuItem(ENavName.TopNav, EMenuItem.StudioMode)
              }
              value={menuItems[EMenuItem.StudioMode].isActive}
              // className={}
            />
            <SwitchInput
              label={$t(EMenuItem.LayoutEditor)}
              layout="horizontal"
              onChange={() =>
                SideNavService.actions.toggleMenuItem(ENavName.TopNav, EMenuItem.LayoutEditor)
              }
              value={menuItems[EMenuItem.LayoutEditor].isActive}
              // className={}
            />
            <SwitchInput
              label={$t(EMenuItem.Themes)}
              layout="horizontal"
              onChange={() =>
                SideNavService.actions.toggleMenuItem(ENavName.TopNav, EMenuItem.Themes)
              }
              value={menuItems[EMenuItem.Themes].isActive}
              // className={}
            />
          </Col>
          <Col flex={3}>
            <SwitchInput
              label={$t(EMenuItem.AppStore)}
              layout="horizontal"
              onChange={() =>
                SideNavService.actions.toggleMenuItem(ENavName.TopNav, EMenuItem.AppStore)
              }
              value={menuItems[EMenuItem.AppStore].isActive}
              // className={}
            />
            {/* TODO: if apps, map over apps */}
          </Col>
        </Row>
      </ObsSettingsSection>

      <ObsSettingsSection>
        <CheckboxInput
          {...bind.enableAnnouncements}
          label={$t('Show announcements for new Streamlabs features and products')}
        />
      </ObsSettingsSection>

      <ObsSettingsSection>
        <ListInput
          {...bind.folderSelection}
          label={$t('Scene item selection mode')}
          options={[
            { value: true, label: $t('Single click selects group. Double click selects item') },
            {
              value: false,
              label: $t('Double click selects group. Single click selects item'),
            },
          ]}
        />
      </ObsSettingsSection>

      {bind.enableFFZEmotes.value && (
        <div className="section">
          <button className="button button--action" onClick={openFFZSettings}>
            {$t('Open FrankerFaceZ Settings')}
          </button>
        </div>
      )}
    </div>
  );
}

AppearanceSettings.page = 'Appearance';
