import React from 'react';
import Scrollable from 'components-react/shared/Scrollable';
import { IAnnouncementsInfo } from 'services/announcements';
import styles from './News.m.less';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import { TAppPage } from 'services/navigation';
import { shell } from 'electron';

const FAKE_NEWS_ITEMS: IAnnouncementsInfo[] = [
  {
    header: 'This is a News Item',
    subHeader:
      'Et fugiat culpa ea magna aliquip commodo veniam enim do deserunt aute ex Lorem. Labore incididunt dolor officia eiusmod enim.',
    thumbnail: '',
    id: 1,
    linkTarget: 'external',
    link: 'jsdkhfdsjk',
    linkTitle: 'Fugiat nostrud dolor',
  },
  {
    header: 'This is a News Item',
    subHeader:
      'Et fugiat culpa ea magna aliquip commodo veniam enim do deserunt aute ex Lorem. Labore incididunt dolor officia eiusmod enim.',
    thumbnail: '',
    id: 2,
    linkTarget: 'external',
    link: 'fdjhsklkfjds',
    linkTitle: 'Fugiat nostrud dolor',
  },
  {
    header: 'This is a News Item',
    subHeader:
      'Et fugiat culpa ea magna aliquip commodo veniam enim do deserunt aute ex Lorem. Labore incididunt dolor officia eiusmod enim.',
    thumbnail: '',
    id: 3,
    linkTarget: 'external',
    link: 'sjkfhdsjkhfskd',
    linkTitle: 'Fugiat nostrud dolor',
  },
  {
    header: 'This is a News Item',
    subHeader:
      'Et fugiat culpa ea magna aliquip commodo veniam enim do deserunt aute ex Lorem. Labore incididunt dolor officia eiusmod enim.',
    thumbnail: '',
    id: 4,
    linkTarget: 'external',
    link: 'sjkfhdsjkfdskj',
    linkTitle: 'Fugiat nostrud dolor',
  },
  {
    header: 'This is a News Item',
    subHeader:
      'Et fugiat culpa ea magna aliquip commodo veniam enim do deserunt aute ex Lorem. Labore incididunt dolor officia eiusmod enim.',
    thumbnail: '',
    id: 5,
    linkTarget: 'external',
    link: 'skjfhdsjk',
    linkTitle: 'Fugiat nostrud dolor',
  },
];

export default function News() {
  const { WindowsService, SettingsService, NavigationService } = Services;

  const newsItems = FAKE_NEWS_ITEMS;

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
