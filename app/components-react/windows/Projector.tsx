import React, { useEffect, useState } from 'react';
import electron from 'electron';
import * as remote from '@electron/remote';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import Display from 'components-react/shared/Display';
import Util from 'services/utils';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import styles from './Projector.m.less';

export default function Projector() {
  const { WindowsService, SourcesService } = Services;

  const [oldBounds, setOldBounds] = useState<electron.Rectangle | null>(null);

  const windowId = Util.getCurrentUrlParams().windowId;
  const { hideStyleBlockers, fullscreen, sourceId, renderingMode } = useVuex(() => {
    return {
      hideStyleBlockers: WindowsService.state[windowId].hideStyleBlockers,
      fullscreen: WindowsService.state[windowId].isFullScreen,
      sourceId: WindowsService.getWindowOptions(windowId).sourceId,
      renderingMode: WindowsService.getWindowOptions(windowId).renderingMode,
    };
  });

  useEffect(() => {
    const sourcesSub = SourcesService.sourceRemoved.subscribe(source => {
      if (source.sourceId === sourceId) {
        remote.getCurrentWindow().close();
      }
    });

    return sourcesSub.unsubscribe;
  }, []);

  function enterFullscreen(display: electron.Display) {
    const currentWindow = remote.getCurrentWindow();
    WindowsService.actions.setOneOffFullscreen(windowId, true);
    setOldBounds(currentWindow.getBounds());
    currentWindow.setPosition(display.bounds.x, display.bounds.y);
    currentWindow.setFullScreen(true);
    document.addEventListener('keydown', exitFullscreen);
  }

  function exitFullscreen(e: KeyboardEvent) {
    if (e.code !== 'Escape') return;
    document.removeEventListener('keydown', exitFullscreen);
    WindowsService.actions.setOneOffFullscreen(windowId, false);
    const currentWindow = remote.getCurrentWindow();
    currentWindow.setFullScreen(false);
    if (oldBounds) {
      currentWindow.setBounds(oldBounds);
    }
  }

  return (
    <div className={styles.projectorContainer}>
      {fullscreen && (
        <div className={styles.projectorFullscreen}>
          <Display sourceId={sourceId} renderingMode={renderingMode} style={{ flexGrow: 1 }} />
        </div>
      )}
      {!fullscreen && (
        <ModalLayout bodyStyle={{ padding: 0 }} hideFooter>
          <div className={styles.projectorWindowed}>
            <Scrollable className={styles.buttonContainer}>
              <div className={styles.projectorButtons}>
                {remote.screen.getAllDisplays().map((display, idx) => (
                  <button
                    className="button button--trans"
                    key={display.id}
                    onClick={() => enterFullscreen(display)}
                  >
                    Fullscreen Display {idx + 1}: {display.size.width}x{display.size.height}
                  </button>
                ))}
              </div>
            </Scrollable>
            {!hideStyleBlockers && <Display sourceId={sourceId} renderingMode={renderingMode} />}
          </div>
        </ModalLayout>
      )}
    </div>
  );
}
