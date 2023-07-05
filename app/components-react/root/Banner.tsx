import React, { useEffect } from 'react';
import { shell } from 'electron';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { TAppPage } from 'services/navigation';
import { $t } from 'services/i18n';
import styles from './Banner.m.less';

export default function Banner() {
  const { AnnouncementsService, SettingsService, NavigationService } = Services;

  const { banner } = useVuex(() => ({ banner: AnnouncementsService.views.banner }));
  if (!banner) return <></>;

  function handleClick() {
    return () => {
      if (banner.linkTarget === 'slobs') {
        if (banner.link === 'Settings') {
          SettingsService.actions.showSettings(banner.params?.category);
        } else {
          NavigationService.actions.navigate(banner.link as TAppPage, banner.params);
        }
      } else {
        shell.openExternal(banner.link);
      }
      if (banner.closeOnLink) close();
    };
  }

  function close() {
    AnnouncementsService.actions.closeBanner();
  }

  return (
    <div className={styles.bannerContainer}>
      {!!banner.thumbnail && <img src={banner.thumbnail} />}
      <strong style={{ color: 'var(--title)' }}>{banner.header}</strong>
      <span>{banner.subHeader}</span>
      <span className={styles.link} onClick={handleClick}>
        {banner.linkTitle}
        <i className="fas fa-arrow-right" />
      </span>
      <span className={styles.close} onClick={close}>
        {$t('Dismiss')}
      </span>
    </div>
  );
}
