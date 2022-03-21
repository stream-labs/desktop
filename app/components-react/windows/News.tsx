import React from 'react';
import Scrollable from 'components-react/shared/Scrollable';
import { IAnnouncementsInfo } from 'services/announcements';
import styles from './News.m.less';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';

const FAKE_NEWS_ITEMS: IAnnouncementsInfo[] = [
  {
    header: 'This is a News Item',
    subHeader:
      'Et fugiat culpa ea magna aliquip commodo veniam enim do deserunt aute ex Lorem. Labore incididunt dolor officia eiusmod enim.',
    thumbnail: '',
    id: 1,
    linkTarget: 'external',
    link: '',
    linkTitle: 'Fugiat nostrud dolor consequat non cupidatat mollit labore magna et.',
  },
  {
    header: 'This is a News Item',
    subHeader:
      'Et fugiat culpa ea magna aliquip commodo veniam enim do deserunt aute ex Lorem. Labore incididunt dolor officia eiusmod enim.',
    thumbnail: '',
    id: 2,
    linkTarget: 'external',
    link: '',
    linkTitle: 'Fugiat nostrud dolor consequat non cupidatat mollit labore magna et.',
  },
  {
    header: 'This is a News Item',
    subHeader:
      'Et fugiat culpa ea magna aliquip commodo veniam enim do deserunt aute ex Lorem. Labore incididunt dolor officia eiusmod enim.',
    thumbnail: '',
    id: 3,
    linkTarget: 'external',
    link: '',
    linkTitle: 'Fugiat nostrud dolor consequat non cupidatat mollit labore magna et.',
  },
  {
    header: 'This is a News Item',
    subHeader:
      'Et fugiat culpa ea magna aliquip commodo veniam enim do deserunt aute ex Lorem. Labore incididunt dolor officia eiusmod enim.',
    thumbnail: '',
    id: 4,
    linkTarget: 'external',
    link: '',
    linkTitle: 'Fugiat nostrud dolor consequat non cupidatat mollit labore magna et.',
  },
  {
    header: 'This is a News Item',
    subHeader:
      'Et fugiat culpa ea magna aliquip commodo veniam enim do deserunt aute ex Lorem. Labore incididunt dolor officia eiusmod enim.',
    thumbnail: '',
    id: 5,
    linkTarget: 'external',
    link: '',
    linkTitle: 'Fugiat nostrud dolor consequat non cupidatat mollit labore magna et.',
  },
];

export default function News() {
  const { WindowsService } = Services;

  const newsItems = FAKE_NEWS_ITEMS;

  function handleClick(item: IAnnouncementsInfo) {
    return () => {
      if (item.closeOnLink) WindowsService.closeChildWindow();
    };
  }

  return (
    <ModalLayout hideFooter>
      <Scrollable>
        {newsItems.map(item => (
          <div className={styles.newsItemContainer} key={item.id}>
            <img className={styles.newsImage} src={item.thumbnail} />
            <h4 className={styles.newsTitle}>{item.header}</h4>
            <span>{item.subHeader}</span>
            <button className={styles.newsButton} onClick={handleClick(item)}>
              {item.link}
            </button>
          </div>
        ))}
      </Scrollable>
    </ModalLayout>
  );
}
