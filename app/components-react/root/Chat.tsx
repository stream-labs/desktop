import { remote } from 'electron';
import React, { useEffect, useRef } from 'react';
import { Services } from '../service-provider';
import styles from './Chat.m.less';
import { OS, getOS } from '../../util/operating-systems';
import { onUnload } from 'util/unload';

export default function Chat(props: { restream: boolean }) {
  const { ChatService, RestreamService } = Services;

  const chatEl = useRef<HTMLDivElement>(null);

  const service = props.restream ? RestreamService : ChatService;

  let currentPosition: IVec2 | null;
  let currentSize: IVec2 | null;
  let resizeInterval: number;

  let leaveFullScreenTrigger: Function;

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
  }, []);

  // Mount/switch chat
  useEffect(() => {
    setupChat();
    const cancelUnload = onUnload(() => service.actions.unmountChat(remote.getCurrentWindow().id));

    return () => {
      service.actions.unmountChat(remote.getCurrentWindow().id);
      cancelUnload();
    };
  }, [props.restream]);

  function setupChat() {
    const windowId = remote.getCurrentWindow().id;

    ChatService.actions.unmountChat();
    RestreamService.actions.unmountChat(windowId);

    service.actions.mountChat(windowId);
    currentPosition = null;
    currentSize = null;
    checkResize();
  }

  function checkResize() {
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

  return <div className={styles.chat} ref={chatEl} />;
}
