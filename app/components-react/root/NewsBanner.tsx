import { shell } from 'electron';
import { $t } from '../../services/i18n';
import React, { useRef, useState } from 'react';
import { Services } from '../service-provider';
import cx from 'classnames';
import styles from './NewsBanner.m.less';
import { TAppPage } from '../../services/navigation';
import { useVuex } from '../hooks';

export default function NewsBanner() {
  const { AnnouncementsService, NavigationService, WindowsService, SettingsService } = Services;

  const [processingClose, setProcessingClose] = useState(false);

  const v = useVuex(() => ({
    currentBanner: AnnouncementsService.state,
    bannerExists: AnnouncementsService.bannerExists,
  }));

  const oldBannerState = useRef(v.bannerExists);

  if (oldBannerState.current !== v.bannerExists) {
    // Toggle style blockers while banner animates
    WindowsService.actions.updateStyleBlockers('main', true);
    window.setTimeout(() => {
      WindowsService.actions.updateStyleBlockers('main', false);
    }, 500);
    oldBannerState.current = v.bannerExists;
  }

  async function closeBanner(
    e?: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    clickType: 'action' | 'dismissal' = 'dismissal',
  ) {
    if (e) e.stopPropagation();
    setProcessingClose(true);
    await AnnouncementsService.closeBanner(clickType);
    setProcessingClose(false);
  }

  function followLink() {
    if (!v.currentBanner) return;
    if (v.currentBanner.linkTarget === 'slobs') {
      // This isn't actually a page, but we want to be able to open it from a banner
      if (v.currentBanner.link === 'Settings') {
        SettingsService.showSettings(v.currentBanner.params?.category);
      } else {
        NavigationService.navigate(v.currentBanner.link as TAppPage, v.currentBanner.params);
      }
    } else {
      shell.openExternal(v.currentBanner.link);
    }
    if (v.currentBanner.closeOnLink) {
      closeBanner(undefined, 'action');
    }
  }

  return (
    <div>
      <div
        className={cx({ [styles.banner]: true, [styles.show]: v.bannerExists })}
        onClick={followLink}
      >
        <div className={styles.leftBlock} />
        <div className={styles.rightBlock} />
        <img className={styles.mainImage} src={v.currentBanner.thumbnail} />
        <div className={styles.titleContainer}>
          <h3 className={styles.title}>{v.currentBanner.header}</h3>
          <span className={styles.subheading}>{v.currentBanner.subHeader}</span>
        </div>
        <div className={styles.ctaContainer}>
          <button className={cx('button', styles.learnMore)} disabled={!v.bannerExists}>
            {v.currentBanner.linkTitle}
          </button>
          <button
            className={styles.dismissButton}
            onClick={closeBanner}
            disabled={!v.bannerExists || processingClose}
          >
            {$t('Dismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
