import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { useVuex } from 'components-react/hooks';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import News from './News';
import Notifications from './Notifications';
import { $t } from 'services/i18n';
import styles from './NotificationsAndNews.m.less';

export default function NotificationsAndNews() {
  const { NotificationsService } = Services;

  const tabNames = {
    news: $t('News'),
    notifications: $t('Notifications'),
  };

  const [selectedTab, setSelectedTab] = useState(tabNames.news);

  const { notificationGroups } = useVuex(() => ({
    notificationGroups: {
      unread: NotificationsService.views.getUnread(),
    },
  }));

  useEffect(() => {
    if (!!notificationGroups && notificationGroups.unread.length > 0) {
      setSelectedTab(tabNames.notifications);
    }
  }, [notificationGroups]);

  return (
    <ModalLayout hideFooter>
      <div className={styles.notificationsMenu}>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedTab]}
          onClick={({ key }: { key: string }) => {
            setSelectedTab(key);
          }}
        >
          {Object.values(tabNames).map(tabName => (
            <Menu.Item key={tabName}>{tabName}</Menu.Item>
          ))}
        </Menu>
      </div>
      {selectedTab === tabNames.notifications ? <Notifications /> : <News />}
    </ModalLayout>
  );
}
