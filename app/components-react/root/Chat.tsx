import * as remote from '@electron/remote';
import React, { useEffect, useRef } from 'react';
import { Services } from '../service-provider';
import styles from './Chat.m.less';
import { OS, getOS } from '../../util/operating-systems';
import { onUnload } from 'util/unload';
import { Button } from 'antd';
import { $t } from 'services/i18n';

export default function Chat(props: { restream: boolean; visibleChat: string }) {
  const { ChatService, RestreamService } = Services;

  const chatEl = useRef<HTMLDivElement>(null);

  let currentPosition: IVec2 | null;
  let currentSize: IVec2 | null;
  let resizeInterval: number;

  let leaveFullScreenTrigger: Function;

  const showTikTokInfo =
    props.visibleChat === 'tiktok' ||
    (props.visibleChat === 'default' &&
      Services.UserService.state.auth?.primaryPlatform === 'tiktok');

  // Setup resize/fullscreen listeners
  useEffect(() => {
    resizeInterval = window.setInterval(() => {
      checkResize();
    }, 100);

    // Work around an electron bug on mac where chat is not interactable
    // after leaving fullscreen until chat is remounted.
    if (getOS() === OS.Mac) {
      leaveFullScreenTrigger = () => {
        setTimeout(() => {
          setupChat();
        }, 1000);
      };

      remote.getCurrentWindow().on('leave-full-screen', leaveFullScreenTrigger);
    }

    return () => {
      clearInterval(resizeInterval);

      if (getOS() === OS.Mac) {
        remote.getCurrentWindow().removeListener('leave-full-screen', leaveFullScreenTrigger);
      }
    };
  }, [props.restream]);

  // Mount/switch chat
  useEffect(() => {
    const service = props.restream ? RestreamService : ChatService;

    setupChat();
    const cancelUnload = onUnload(() => service.actions.unmountChat(remote.getCurrentWindow().id));

    return () => {
      service.actions.unmountChat(remote.getCurrentWindow().id);
      cancelUnload();
    };
  }, [props.restream]);

  function setupChat() {
    const service = props.restream ? RestreamService : ChatService;
    const windowId = remote.getCurrentWindow().id;

    ChatService.actions.unmountChat();
    RestreamService.actions.unmountChat(windowId);

    service.actions.mountChat(windowId);
    currentPosition = null;
    currentSize = null;
    checkResize();
  }

  function checkResize() {
    const service = props.restream ? RestreamService : ChatService;

    if (!chatEl.current) return;

    const rect = chatEl.current.getBoundingClientRect();

    if (currentPosition == null || currentSize == null || rectChanged(rect)) {
      currentPosition = { x: rect.left, y: rect.top };
      currentSize = { x: rect.width, y: rect.height };

      service.actions.setChatBounds(currentPosition, currentSize);
    }
  }

  function rectChanged(rect: ClientRect) {
    return (
      rect.left !== currentPosition?.x ||
      rect.top !== currentPosition?.y ||
      rect.width !== currentSize?.x ||
      rect.height !== currentSize?.y
    );
  }

  return showTikTokInfo ? <TikTokChatInfo /> : <div className={styles.chat} ref={chatEl} />;
}

function TikTokChatInfo() {
  function openPlatformDash() {
    remote.shell.openExternal(Services.TikTokService.dashboardUrl);
  }
  return (
    <div
      className={styles.chat}
      style={{ display: 'flex', flexDirection: 'column', marginTop: '30px' }}
    >
      <div style={{ marginBottom: '5px' }}>
        {$t('Access chat for TikTok in the TikTok Live Center.')}
      </div>
      <Button style={{ width: '200px', marginBottom: '10px' }} onClick={openPlatformDash}>
        {$t('Open TikTok Live Center')}
      </Button>
    </div>
  );
}
