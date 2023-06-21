import React, { useEffect } from 'react';
import { shell } from 'electron';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { TAppPage } from 'services/navigation';
import { $t } from 'services/i18n';
import styles from './Banner.m.less';

export default function Banner() {
  const { AnnouncementsService, SettingsService, NavigationService } = Services;

  useEffect(() => {
    AnnouncementsService.actions.getBanner();
  }, []);

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
      if (banner.closeOnLink) AnnouncementsService.actions.clearBanner();
    };
  }

  return (
    <div className={styles.bannerContainer}>
      {banner.thumbnail}
      <strong style={{ color: 'var(--title)' }}>{banner.header}</strong>
      <span>{banner.subHeader}</span>
      <span style={{ color: 'var(--new)' }} onClick={handleClick}>
        {banner.linkTitle}
      </span>
      <i className="fas fa-arrow-right" style={{ color: 'var(--new)' }} />
      <span className={styles.close}>{$t('Dismiss')}</span>
    </div>
  );
}
