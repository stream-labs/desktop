import React, { useRef, useEffect } from 'react';
import * as remote from '@electron/remote';
import { EAppPageSlot } from 'services/platform-apps';
import Utils from 'services/utils';
import { useRenderInterval, useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';

export default function PlatformAppPageView(p: {
  appId: string;
  pageSlot: EAppPageSlot;
  style?: React.CSSProperties;
}) {
  const { PlatformAppsService, WindowsService } = Services;

  const appContainer = useRef<HTMLDivElement>(null);

  let currentPosition: IVec2 | null;
  let currentSize: IVec2 | null;
  let containerId: string | null;

  const { hideStyleBlockers } = useVuex(() => ({
    hideStyleBlockers: WindowsService.state[Utils.getWindowId()].hideStyleBlockers,
  }));

  useEffect(() => {
    mountContainer();

    const subscription = PlatformAppsService.appLoad.subscribe(app => {
      if (p.appId === app.id) {
        unmountContainer();
        mountContainer();
      }
    });

    const interval = window.setInterval(checkResize, 100);

    return () => {
      subscription.unsubscribe();
      unmountContainer();
      clearInterval(interval);
    };
  }, []);

  async function mountContainer() {
    containerId = await PlatformAppsService.actions.return.mountContainer(
      p.appId,
      p.pageSlot,
      remote.getCurrentWindow().id,
      Utils.getWindowId(),
    );
    checkResize();
  }

  function unmountContainer() {
    currentPosition = null;
    currentSize = null;
    if (!containerId) return;
    PlatformAppsService.actions.unmountContainer(containerId, remote.getCurrentWindow().id);
  }

  function checkResize() {
    if (!appContainer.current || !containerId) return;
    const rect: { left: number; top: number; width: number; height: number } = hideStyleBlockers
      ? { left: 0, top: 0, width: 0, height: 0 }
      : appContainer.current.getBoundingClientRect();

    if (currentPosition == null || currentSize == null || rectChanged(rect)) {
      currentPosition = { x: rect.left, y: rect.top };
      currentSize = { x: rect.width, y: rect.height };

      PlatformAppsService.actions.setContainerBounds(containerId, currentPosition, currentSize);
    }
  }

  function rectChanged(rect: { left: number; top: number; width: number; height: number }) {
    if (!currentPosition || !currentSize) return;
    return (
      rect.left !== currentPosition.x ||
      rect.top !== currentPosition.y ||
      rect.width !== currentSize.x ||
      rect.height !== currentSize.y
    );
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', width: '100%', ...p.style }}
      ref={appContainer}
    />
  );
}
