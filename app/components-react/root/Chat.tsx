import { remote } from 'electron';
import React, { useEffect, useRef } from 'react';
import { Services } from '../service-provider';
import styles from './Chat.m.less';
import { OS, getOS } from '../../util/operating-systems';

export default function Chat(props: { restream: boolean }) {
  const { ChatService, RestreamService } = Services;

  const chatEl = useRef<HTMLDivElement>(null);

  const service = props.restream ? RestreamService : ChatService;

  let currentPosition: IVec2 | null;
  let currentSize: IVec2 | null;
  let resizeInterval: number;

  let leaveFullScreenTrigger: Function;

  useEffect(lifecycle, []);
  useEffect(changeChat, [props.restream]);

  function lifecycle() {
    mounted();

    return function cleanup() {
      service.actions.unmountChat(remote.getCurrentWindow().id);
      clearInterval(resizeInterval);

      if (getOS() === OS.Mac) {
        remote.getCurrentWindow().removeListener('leave-full-screen', leaveFullScreenTrigger);
      }
    };
  }

  function mounted() {
    service.actions.mountChat(remote.getCurrentWindow().id);

    resizeInterval = window.setInterval(() => {
      checkResize();
    }, 100);

    // Work around an electron bug on mac where chat is not interactable
    // after leaving fullscreen until chat is remounted.
    if (getOS() === OS.Mac) {
      leaveFullScreenTrigger = () => {
        setTimeout(() => {
          changeChat();
        }, 1000);
      };

      remote.getCurrentWindow().on('leave-full-screen', leaveFullScreenTrigger);
    }
  }

  function changeChat() {
    const windowId = remote.getCurrentWindow().id;

    ChatService.unmountChat();
    RestreamService.unmountChat(windowId);

    service.mountChat(windowId);
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
