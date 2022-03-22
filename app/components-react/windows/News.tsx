import React from 'react';
import { shell } from 'electron';
import Scrollable from 'components-react/shared/Scrollable';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { TAppPage } from 'services/navigation';
import { IAnnouncementsInfo } from 'services/announcements';
import styles from './News.m.less';

export default function News() {
  const { WindowsService, SettingsService, NavigationService, AnnouncementsService } = Services;

  const { newsItems } = useVuex(() => ({
    newsItems: AnnouncementsService.state,
  }));

  function handleClick(item: IAnnouncementsInfo) {
    return () => {
      if (item.linkTarget === 'slobs') {
        if (item.link === 'Settings') {
          SettingsService.showSettings(item.params?.category);
        } else {
          NavigationService.navigate(item.link as TAppPage);
        }
      } else {
        shell.openExternal(item.link);
      }
      if (item.closeOnLink) WindowsService.closeChildWindow();
    };
  }

  return (
    <ModalLayout hideFooter>
      <Scrollable style={{ height: '100%' }} snapToWindowEdge>
        {newsItems.map(item => (
          <div className={styles.newsItemContainer} key={item.id}>
            <img className={styles.newsImage} src={item.thumbnail} />
            <h4>{item.header}</h4>
            <span>{item.subHeader}</span>
            <button className="button button--action" onClick={handleClick(item)}>
              {item.linkTitle}
            </button>
          </div>
        ))}
      </Scrollable>
    </ModalLayout>
  );
}
