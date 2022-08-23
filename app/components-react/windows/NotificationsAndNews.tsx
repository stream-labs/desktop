import React, { useState, useEffect } from 'react';
import moment from 'moment';
import cx from 'classnames';
import { Menu } from 'antd';
import { useRenderInterval, useVuex } from 'components-react/hooks';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import Scrollable from 'components-react/shared/Scrollable';
import { INotification } from 'services/notifications';
import { $t } from 'services/i18n';
import styles from './NotificationsAndNews.m.less';

enum NotificationTab {
  News = 'News',
  Notifications = 'Notifications',
}

export default function NotificationsAndNews() {
  const { NotificationsService } = Services;

  // Re-render every minute to refresh timestamps
  useRenderInterval(() => {}, 60 * 1000);
  useEffect(() => () => NotificationsService.actions.markAllAsRead(), []);
  const [selectedTab, setSelectedTab] = useState(NotificationTab.News);

  const { notificationGroups, notificationsCount } = useVuex(() => ({
    notificationGroups: {
      unread: NotificationsService.views.getUnread(),
      read: NotificationsService.views.getRead(),
    },
    notificationsCount: NotificationsService.views.getAll().length,
  }));

  useEffect(() => {
    if (!!notificationGroups && notificationGroups.unread.length > 0) {
      setSelectedTab(NotificationTab.Notifications);
    }
  }, [notificationGroups]);

  function onNotificationClickHandler(id: number) {
    NotificationsService.actions.applyAction(id);
  }

  function momentize(time: number): string {
    return moment(time).fromNow();
  }

  return (
    <ModalLayout hideFooter>
      <Scrollable style={{ height: '100%' }}>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedTab]}
          onClick={() => {
            console.log('firing');
          }}
          className={styles.menu}
        >
          {Object.values(NotificationTab).map(tabName => (
            <Menu.Item key={tabName}>{tabName}</Menu.Item>
          ))}
        </Menu>
        {!notificationsCount && <h4>{$t("You don't have any notifications")}</h4>}
        {Object.keys(notificationGroups).map((groupName: string) => (
          <div key={groupName}>
            {notificationGroups[groupName].length > 0 && (
              <h4>{groupName === 'unread' ? $t('New Notifications') : $t('Log')}</h4>
            )}
            {notificationGroups[groupName].map((notify: INotification) => (
              <div
                key={notify.id}
                onClick={() => onNotificationClickHandler(notify.id)}
                className={cx(styles.notification, {
                  [styles.unread]: notify.unread,
                  [styles.hasAction]: notify.action,
                })}
                data-name={notify.action && 'hasAction'}
              >
                <div className="icon">
                  {notify.type === 'INFO' && <span className="fa fa-info-circle" />}
                  {notify.type === 'WARNING' && <span className="fa fa-warning" />}
                </div>
                <div className="message">{notify.message}</div>
                <div className={styles.date}>{momentize(notify.date)}</div>
              </div>
            ))}
          </div>
        ))}
      </Scrollable>
    </ModalLayout>
  );
}
