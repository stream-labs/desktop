import React, { useState, useEffect, useRef } from 'react';
import { injectState, useModule } from 'slap';
import { Badge, Tooltip } from 'antd';
import moment from 'moment';
import cx from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import { Services } from '../service-provider';
import { ENotificationType, INotification, ENotificationSubType } from 'services/notifications';
import { $t } from 'services/i18n';
import styles from './NotificationsArea.m.less';
const notificationAudio = require('../../../media/sound/ding.wav');

class NotificationsModule {
  state = injectState({
    currentNotif: {} as INotification,
  });

  notifQueue = cloneDeep(Services.NotificationsService.state.notifications);

  audio = new Audio(notificationAudio);

  playNotif(notif: INotification) {
    if (this.state.currentNotif.id) {
      this.notifQueue.push(notif);
    } else {
      this.addCurrentNotif(notif);
    }
  }

  addCurrentNotif(notif: INotification) {
    this.state.setCurrentNotif(notif);

    if (this.settings.playSound) this.audio.play();

    if (notif.lifeTime !== -1) {
      setTimeout(() => this.finishNotif(), notif.lifeTime);
    }
  }

  finishNotif() {
    this.state.setCurrentNotif({} as INotification);

    if (this.notifQueue.length > 0) {
      this.state.setCurrentNotif(this.notifQueue.shift() as INotification);
    }
  }

  clearQueueOfRead(ids: number[]) {
    this.notifQueue = this.notifQueue.filter(notif => !ids.includes(notif.id));
  }

  get unreadWarnings() {
    return Services.NotificationsService.views.getUnread(ENotificationType.WARNING);
  }

  get unreadNotifs() {
    return Services.NotificationsService.views.getUnread();
  }

  get settings() {
    return Services.NotificationsService.state.settings;
  }

  clickNotif() {
    if (!this.state.currentNotif.id) return;
    Services.NotificationsService.applyAction(this.state.currentNotif.id);
    Services.NotificationsService.markAsRead(this.state.currentNotif.id);
    this.finishNotif();
  }
}

function useNotifications() {
  return useModule(NotificationsModule);
}

export default function NotificationsArea() {
  const { NotificationsService, AnnouncementsService } = Services;

  const {
    notifQueue,
    currentNotif,
    unreadWarnings,
    unreadNotifs,
    settings,
    finishNotif,
    playNotif,
    clearQueueOfRead,
    clickNotif,
  } = useNotifications();

  const notificationsContainer = useRef<HTMLDivElement>(null);
  const [showExtendedNotifications, setShowExtendedNotifications] = useState(true);

  const showNotificationsTooltip = $t('Click to open your Notifications window');
  const showUnreadNotificationsTooltip = $t('Click to read your unread Notifications');

  useEffect(() => {
    if (notifQueue.length > 0) {
      finishNotif();
    }

    const notifPushedSub = NotificationsService.notificationPushed.subscribe(notif => {
      playNotif(notif);
    });
    const notifReadSub = NotificationsService.notificationRead.subscribe(ids => {
      clearQueueOfRead(ids);
    });

    const resizeInterval = window.setInterval(() => {
      if (!notificationsContainer.current) return;
      setShowExtendedNotifications(notificationsContainer.current?.offsetWidth >= 150);
    }, 1000);

    return () => {
      notifPushedSub.unsubscribe();
      notifReadSub.unsubscribe();
      clearInterval(resizeInterval);
    };
  }, []);

  function fromNow(time: number): string {
    return moment(time).fromNow();
  }

  function showNotifications() {
    NotificationsService.actions.showNotifications();
  }

  function showNews() {
    if (
      unreadNotifs.every(notif => notif.subType === ENotificationSubType.NEWS) ||
      unreadNotifs.length === 0
    ) {
      AnnouncementsService.actions.openNewsWindow();
    } else {
      showNotifications();
    }
  }

  if (!settings.enabled) return <></>;

  return (
    <div className={cx(styles.notificationsArea, 'flex--grow')}>
      {unreadWarnings.length > 0 && (
        <Tooltip placement="right" title={showUnreadNotificationsTooltip}>
          <div
            className={cx(styles.notificationsCounter, styles.notificationsCounterWarning)}
            onClick={showNotifications}
          >
            <Badge dot={unreadWarnings.length > 0} color="red">
              <i className="fa fa-exclamation-triangle" />
              {unreadWarnings}
            </Badge>
          </div>
        </Tooltip>
      )}
      {!unreadWarnings && (
        <Tooltip placement="right" title={showNotificationsTooltip}>
          <div className={styles.notificationsCounter} onClick={showNews}>
            <Badge dot={unreadNotifs.length > 0}>
              <i className="icon-notifications" />
            </Badge>
          </div>
        </Tooltip>
      )}
      <div className={cx(styles.notificationsContainer, 'flex--grow')} ref={notificationsContainer}>
        {showExtendedNotifications && (
          <div
            key={`${currentNotif.message}${currentNotif.date}`}
            className={cx(styles.notification, {
              [styles.info]: currentNotif.type === 'INFO',
              [styles.warning]: currentNotif.type === 'WARNING',
              [styles.success]: currentNotif.type === 'SUCCESS',
              [styles.hasAction]: currentNotif.action,
            })}
            onClick={clickNotif}
          >
            {currentNotif.message}{' '}
            {currentNotif.showTime && <span> {fromNow(currentNotif.date)}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
