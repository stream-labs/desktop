import React, { useState, useEffect, useRef } from 'react';
import { injectState, mutation, useModule } from 'slap';
import { Badge, Tooltip } from 'antd';
import moment from 'moment';
import cx from 'classnames';
import { useVuex, useRenderInterval } from '../hooks';
import cloneDeep from 'lodash/cloneDeep';
import { Services } from '../service-provider';
import { ENotificationType, INotification, ENotificationSubType } from 'services/notifications';
import { $t } from 'services/i18n';
import styles from './NotificationsArea.m.less';
const notificationAudio = require('../../../media/sound/ding.wav');

interface IUiNotification extends INotification {
  outdated?: boolean;
}

class NotificationsModule {
  state = injectState({
    currentNotif: {} as IUiNotification,
  });

  notifQueue = cloneDeep(Services.NotificationsService.state.notifications);

  audio = new Audio(notificationAudio);

  playNotif(notif: IUiNotification) {
    if (this.state.currentNotif.id) {
      this.notifQueue.push(notif);
    } else {
      this.addCurrentNotif(notif);
    }
  }

  addCurrentNotif(notif: IUiNotification) {
    this.state.setCurrentNotif(notif);

    if (this.settings.playSound) this.audio.play();

    if (notif.lifeTime !== -1) {
      setTimeout(() => this.finishNotif(), notif.lifeTime);
    }
  }

  finishNotif() {
    this.state.setCurrentNotif({} as IUiNotification);

    if (this.notifQueue.length > 0) {
      this.state.setCurrentNotif(this.notifQueue.shift() as IUiNotification);
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
  } = useNotifications();

  const notificationsContainer = useRef<HTMLDivElement>(null);
  const [showExtendedNotifications, setShowExtendedNotifications] = useState(true);

  const notifyAudio = useRef(new Audio(notificationAudio));

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

  function showNotification(notif: INotification) {
    if (!settings.enabled || !notif.playSound) return;
    notifyAudio.current.play();

    setNotifications(notifications.filter(note => !note.outdated));

    // setup order of appearing elements to have a correct animation
    requestAnimationFrame(() => {
      setNotifications(
        notifications.map((n, i) => ({ ...n, outdated: i === 0 ? true : n.outdated })),
      );

      requestAnimationFrame(() => {
        setNotifications([...notifications, { ...notif, outdated: false }]);
        if (notif.lifeTime !== -1) window.setTimeout(() => hideOutdated(), notif.lifeTime);
      });
    });
  }

  function onNotificationHandler(notif: INotification) {
    if (
      [
        ENotificationSubType.DROPPED,
        ENotificationSubType.LAGGED,
        ENotificationSubType.SKIPPED,
      ].includes(notif.subType)
    ) {
      return;
    }
    setNotificationQueue([...notificationQueue, notif]);
    if (canShowNextNotif) checkQueue();
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

  function onNotificationClickHandler(id: number) {
    const notif = notifications.find(notif => notif.id === id);
    if (!notif || notif.outdated) return;
    NotificationsService.applyAction(id);
    NotificationsService.markAsRead(id);
    notif.outdated = true;
  }

  function hideOutdated() {
    notifications.forEach(uiNotif => {
      const notif = NotificationsService.views.getNotification(uiNotif.id);
      if (!notif) return;
      const now = Date.now();
      if (!notif.unread || (notif.lifeTime !== -1 && now - notif.date > notif.lifeTime)) {
        uiNotif.outdated = true;
      }
    });
  }

  if (!settings.enabled) return <></>;

  return (
    <div className={cx(styles.notificationsArea, 'flex--grow')}>
      {unreadWarnings > 0 && (
        <Tooltip placement="right" title={showUnreadNotificationsTooltip}>
          <div
            className={cx(styles.notificationsCounter, styles.notificationsCounterWarning)}
            onClick={showNotifications}
          >
            <Badge dot={unreadWarnings > 0} color="red">
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
        {notifications.map(
          notif =>
            showExtendedNotifications && (
              <div
                key={`${notif.message}${notif.date}`}
                className={cx(styles.notification, {
                  [styles.info]: notif.type === 'INFO',
                  [styles.warning]: notif.type === 'WARNING',
                  [styles.success]: notif.type === 'SUCCESS',
                  [styles.hasAction]: notif.action && !notif.outdated,
                  [styles.outdated]: notif.outdated,
                })}
                onClick={() => onNotificationClickHandler(notif.id)}
              >
                {notif.message} {notif.showTime && <span> {fromNow(notif.date)}</span>}
              </div>
            ),
        )}
      </div>
    </div>
  );
}
