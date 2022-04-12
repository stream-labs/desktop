import React, { useState } from 'react';
import cx from 'classnames';
import electron from 'electron';
import Utils from 'services/utils';
import { $t } from 'services/i18n';
import throttle from 'lodash/throttle';
import { Services } from '../service-provider';
import { useVuex } from '../hooks';
import styles from './SideNav.m.less';
import * as remote from '@electron/remote';

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

  const { studioMode, isLoggedIn, isPrime } = useVuex(
    () => ({
      studioMode: TransitionsService.views.studioMode,
      isLoggedIn: UserService.views.isLoggedIn,
      isPrime: UserService.views.isPrime,
    }),
    false,
  );

  const [dashboardOpening, setDashboardOpening] = useState(false);

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

  function toggleStudioMode() {
    UsageStatisticsService.actions.recordClick('NavTools', 'studio-mode');
    if (studioMode) {
      TransitionsService.actions.disableStudioMode();
    } else {
      TransitionsService.actions.enableStudioMode();
    }
  }

  async function openDashboard(page?: string) {
    UsageStatisticsService.actions.recordClick('NavTools', page || 'dashboard');
    if (dashboardOpening) return;
    setDashboardOpening(true);

    try {
      const link = await MagicLinkService.getDashboardMagicLink(page);
      remote.shell.openExternal(link);
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }

    setDashboardOpening(false);
  }

  const throttledOpenDashboard = throttle(openDashboard, 2000, { trailing: false });

  function openHelp() {
    UsageStatisticsService.actions.recordClick('NavTools', 'help');
    remote.shell.openExternal('https://howto.streamlabs.com/');
  }

  async function upgradeToPrime() {
    UsageStatisticsService.actions.recordClick('NavTools', 'prime');
    try {
      const link = await MagicLinkService.getDashboardMagicLink(
        'prime-marketing',
        'slobs-side-nav',
      );
      remote.shell.openExternal(link);
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
      {isLoggedIn && !isPrime && (
        <div
          className={cx(styles.cell, styles.primeCell)}
          onClick={upgradeToPrime}
          title={$t('Get Prime')}
        >
          <i className="icon-prime" />
        </div>
      )}
      {isLoggedIn && (
        <div
          className={cx(styles.cell)}
          onClick={() => throttledOpenDashboard()}
          title={$t('Dashboard')}
        >
          <i className="icon-dashboard" />
        </div>
      )}
      {isLoggedIn && (
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
        className={cx(styles.cell, { [styles.toggleOn]: studioMode })}
        onClick={toggleStudioMode}
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
