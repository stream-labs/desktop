import React, { useState } from 'react';
import cx from 'classnames';
import electron from 'electron';
import Utils from '../../services/utils';
import { $t } from '../../services/i18n';
import styles from '../../components/SideNav.m.less';
import throttle from 'lodash/throttle';
import { Services } from '../service-provider';
import { useVuex } from '../hooks';

export default function SideNav() {
  const {
    UserService,
    TransitionsService,
    SettingsService,
    NavigationService,
    MagicLinkService,
    UsageStatisticsService,
  } = Services;

  const isDevMode = Utils.isDevMode();

  const v = useVuex(
    () => ({
      studioMode: TransitionsService.views.studioMode,
      isLoggedIn: UserService.views.isLoggedIn,
      isPrime: UserService.views.isPrime,
    }),
    false,
  );

  const [s, setState] = useState({ dashboardOpening: false });

  function openSettingsWindow() {
    UsageStatisticsService.actions.recordClick('NavTools', 'settings');
    SettingsService.actions.showSettings();
  }

  function openLayoutEditor() {
    UsageStatisticsService.actions.recordClick('NavTools', 'layout-editor');
    NavigationService.actions.navigate('LayoutEditor');
  }

  function openDevTools() {
    electron.ipcRenderer.send('openDevTools');
  }

  function studioMode() {
    UsageStatisticsService.actions.recordClick('NavTools', 'studio-mode');
    if (v.studioMode) {
      TransitionsService.actions.disableStudioMode();
    } else {
      TransitionsService.actions.enableStudioMode();
    }
  }

  async function openDashboard(page?: string) {
    UsageStatisticsService.actions.recordClick('NavTools', page || 'dashboard');
    if (s.dashboardOpening) return;
    setState({ dashboardOpening: true });

    try {
      const link = await MagicLinkService.getDashboardMagicLink(page);
      electron.remote.shell.openExternal(link);
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }

    setState({ dashboardOpening: false });
  }

  const throttledOpenDashboard = throttle(openDashboard, 2000, { trailing: false });

  function openHelp() {
    UsageStatisticsService.actions.recordClick('NavTools', 'help');
    electron.remote.shell.openExternal('https://howto.streamlabs.com/');
  }

  async function upgradeToPrime() {
    UsageStatisticsService.actions.recordClick('NavTools', 'prime');
    try {
      const link = await MagicLinkService.getDashboardMagicLink(
        'prime-marketing',
        'slobs-side-nav',
      );
      electron.remote.shell.openExternal(link);
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }
  }

  return (
    <div className={styles.bottomTools}>
      {isDevMode && (
        <div className={styles.cell} onClick={openDevTools} title={'Dev Tools'}>
          <i className="icon-developer" />
        </div>
      )}
      {v.isLoggedIn && !v.isPrime && (
        <div
          className={cx(styles.cell, styles.primeCell)}
          onClick={upgradeToPrime}
          title={$t('Get Prime')}
        >
          <i className="icon-prime" />
        </div>
      )}
      {v.isLoggedIn && (
        <div
          className={cx(styles.cell)}
          onClick={() => throttledOpenDashboard()}
          title={$t('Dashboard')}
        >
          <i className="icon-dashboard" />
        </div>
      )}
      {v.isLoggedIn && (
        <div
          className={cx(styles.cell)}
          onClick={() => throttledOpenDashboard('cloudbot')}
          title={$t('Cloudbot')}
        >
          <i className="icon-cloudbot" />
        </div>
      )}
      <div className={styles.cell} onClick={openLayoutEditor} title={$t('Layout Editor')}>
        <i className="fas fa-th-large" />
      </div>
      <div
        className={cx(styles.cell, { [styles.toggleOn]: v.studioMode })}
        onClick={studioMode}
        title={$t('Studio Mode')}
      >
        <i className="icon-studio-mode-3" />
      </div>
      <div className={styles.cell} onClick={openHelp} title={$t('Get Help')}>
        <i className="icon-question" />
      </div>
      <div className={styles.cell} onClick={openSettingsWindow} title={$t('Settings')}>
        <i className="icon-settings" />
      </div>
    </div>
  );
}
