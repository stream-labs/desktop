import React, { useState, useEffect, useRef } from 'react';
import { injectState, useModule } from 'slap';
import { Badge, message, Tooltip } from 'antd';
import moment from 'moment';
import cx from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import { Services } from '../service-provider';
import { ENotificationType, INotification, ENotificationSubType } from 'services/notifications';
import { $t } from 'services/i18n';
import styles from './NotificationsArea.m.less';
const notificationAudio = require('../../../media/sound/ding.wav');

class NotificationsModule {
  currentNotif: INotification | null = null;
  notifQueue = cloneDeep(Services.NotificationsService.state.notifications);

  audio = new Audio(notificationAudio);

  readyToPlay = false;

  setReadyToPlay() {
    if (this.readyToPlay) return;

    this.readyToPlay = true;
    this.playNext();
  }

  // Add Notification to queue if one is playing, otherwise play it
  addNotif(notif: INotification) {
    if (this.currentNotif || !this.readyToPlay) {
      this.notifQueue.push(notif);
    } else {
      this.playNotif(notif);
    }
  }

  playNotif(notif: INotification) {
    if (!this.settings.enabled) return;
    this.currentNotif = notif;
    if (this.settings.playSound) this.audio.play();

    message
      .info({
        content: <MessageNode notif={notif} />,
        duration: notif.lifeTime === -1 ? 0 : notif.lifeTime / 1000,
        key: `${notif.message}${notif.date}`,
        onClick: () => this.clickNotif(),
        className: cx(styles.notification, {
          [styles.info]: notif.type === 'INFO',
          [styles.warning]: notif.type === 'WARNING',
          [styles.success]: notif.type === 'SUCCESS',
          [styles.hasAction]: notif.action,
        }),
      })
      .then(() => this.playNext());
  }

  // Play next Notification in the queue, otherwise clear the current Notification
  playNext() {
    if (this.currentNotif) {
      message.destroy();
    }
    if (this.notifQueue.length > 0) {
      this.playNotif(this.notifQueue.shift() as INotification);
    } else {
      this.currentNotif = null;
    }
  }

  // Remove already ready Notifications captured via subscription from the queue
  clearQueueOfRead(ids: number[]) {
    this.notifQueue = this.notifQueue.filter(notif => !ids.includes(notif.id));
    if (this.currentNotif && ids.includes(this.currentNotif.id)) this.playNext();
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
    if (!this.currentNotif) return;
    if (this.currentNotif.action) {
      Services.NotificationsService.actions.applyAction(this.currentNotif.id);
      Services.NotificationsService.actions.markAsRead(this.currentNotif.id);
    } else {
      Services.NotificationsService.actions.showNotifications();
    }
    this.playNext();
  }
}

function useNotifications() {
  return useModule(NotificationsModule);
}

export default function NotificationsArea() {
  const { NotificationsService, AnnouncementsService } = Services;

  const {
    unreadWarnings,
    unreadNotifs,
    settings,
    addNotif,
    playNext,
    clearQueueOfRead,
    setReadyToPlay,
  } = useNotifications();

  const notificationsContainer = useRef<HTMLDivElement>(null);
  const [showExtendedNotifications, setShowExtendedNotifications] = useState(true);

  const showNotificationsTooltip = $t('Click to open your Notifications window');
  const showUnreadNotificationsTooltip = $t('Click to read your unread Notifications');

  useEffect(() => {
    const notifPushedSub = NotificationsService.notificationPushed.subscribe(addNotif);
    const notifReadSub = NotificationsService.notificationRead.subscribe(clearQueueOfRead);

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

  useEffect(() => {
    message.config({
      getContainer: () => notificationsContainer.current as HTMLElement,
      maxCount: showExtendedNotifications ? 1 : 0,
    });
    setReadyToPlay();
  }, [showExtendedNotifications]);

  function showNotifications() {
    NotificationsService.actions.showNotifications();
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
              {unreadWarnings.length}
            </Badge>
          </div>
        </Tooltip>
      )}
      {unreadWarnings.length < 1 && (
        <Tooltip placement="right" title={showNotificationsTooltip}>
          <div className={styles.notificationsCounter} onClick={showNotifications}>
            <Badge dot={unreadNotifs.length > 0}>
              <i className="icon-notifications" />
            </Badge>
          </div>
        </Tooltip>
      )}
      <div
        className={cx(styles.notificationsContainer, 'flex--grow')}
        ref={notificationsContainer}
      />
    </div>
  );
}

function MessageNode(p: { notif: INotification }) {
  function fromNow(time: number): string {
    return moment(time).fromNow();
  }

  return (
    <>
      {p.notif.message} {p.notif.showTime && <span> {fromNow(p.notif.date)}</span>}
    </>
  );
}
