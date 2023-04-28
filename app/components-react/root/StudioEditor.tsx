import { useVuex } from 'components-react/hooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './StudioEditor.m.less';
import { Services } from 'components-react/service-provider';
import cx from 'classnames';
import Display from 'components-react/shared/Display';
import { $t } from 'services/i18n';
import { ERenderingMode } from '../../../obs-api';

export default function StudioEditor() {
  const { WindowsService, CustomizationService, EditorService, TransitionsService } = Services;
  const v = useVuex(() => ({
    hideStyleBlockers: WindowsService.state.main.hideStyleBlockers,
    performanceMode: CustomizationService.state.performanceMode,
    cursor: EditorService.state.cursor,
    studioMode: TransitionsService.state.studioMode,
  }));
  const displayEnabled = !v.hideStyleBlockers && !v.performanceMode;
  const placeholderRef = useRef<HTMLDivElement>(null);
  const studioModeRef = useRef<HTMLDivElement>(null);
  const [studioModeStacked, setStudioModeStacked] = useState(false);
  const [verticalPlaceholder, setVerticalPlaceholder] = useState(false);
  const studioModeTransitionName = useMemo(() => TransitionsService.getStudioTransitionName(), [
    v.studioMode,
  ]);

  // Track vertical orientation for placeholder
  useEffect(() => {
    let timeout: number;

    if (displayEnabled || v.performanceMode) return;

    function checkVerticalOrientation() {
      if (placeholderRef.current) {
        const { clientWidth, clientHeight } = placeholderRef.current;
        setVerticalPlaceholder(clientWidth / clientHeight < 16 / 9);
      }

      timeout = window.setTimeout(checkVerticalOrientation, 1000);
    }

    checkVerticalOrientation();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [displayEnabled, v.performanceMode]);

  // Track orientation for studio mode
  useEffect(() => {
    if (!v.studioMode) return;

    let timeout: number;

    function checkStudioModeOrientation() {
      if (studioModeRef.current) {
        const { clientWidth, clientHeight } = studioModeRef.current;
        setStudioModeStacked(clientWidth / clientHeight < 16 / 9);
      }

      timeout = window.setTimeout(checkStudioModeOrientation, 1000);
    }

    checkStudioModeOrientation();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [v.studioMode]);

  // This is a bit weird, but it's a performance optimization.
  // This component heavily re-renders, so trying to do as little
  // as possible on each re-render, including defining event handlers,
  // which in this case don't rely on the closure and therefore never
  // need to be redefined. It also ensures a single closure that never
  // changes for the moveInFlight piece of the mouseMove handler.
  const eventHandlers = useMemo(() => {
    function getMouseEvent(event: React.MouseEvent) {
      return {
        offsetX: event.nativeEvent.offsetX,
        offsetY: event.nativeEvent.offsetY,
        pageX: event.pageX,
        pageY: event.pageY,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        button: event.button,
        buttons: event.buttons,
      };
    }

    let moveInFlight = false;
    let lastMoveEvent: React.MouseEvent | null = null;

    function onMouseMove(event: React.MouseEvent) {
      if (moveInFlight) {
        lastMoveEvent = event;
        return;
      }

      moveInFlight = true;
      EditorService.actions.return.handleMouseMove(getMouseEvent(event)).then(() => {
        moveInFlight = false;

        if (lastMoveEvent) {
          onMouseMove(lastMoveEvent);
          lastMoveEvent = null;
        }
      });
    }

    return {
      onOutputResize(rect: IRectangle) {
        EditorService.actions.handleOutputResize(rect);
      },

      onMouseDown(event: React.MouseEvent) {
        EditorService.actions.handleMouseDown(getMouseEvent(event));
      },

      onMouseUp(event: React.MouseEvent) {
        EditorService.actions.handleMouseUp(getMouseEvent(event));
      },

      onMouseEnter(event: React.MouseEvent) {
        EditorService.actions.handleMouseEnter(getMouseEvent(event));
      },

      onMouseDblClick(event: React.MouseEvent) {
        EditorService.actions.handleMouseDblClick(getMouseEvent(event));
      },

      onMouseMove,

      enablePreview() {
        CustomizationService.actions.setSettings({ performanceMode: false });
      },

      onContextMenu(event: React.MouseEvent) {
        event.stopPropagation();
      },
    };
  }, []);

  return (
    <div className={styles.mainContainer} ref={studioModeRef}>
      {displayEnabled && (
        <div className={cx(styles.studioModeContainer, { [styles.stacked]: studioModeStacked })}>
          {v.studioMode && <StudioModeControls stacked={studioModeStacked} />}
          <div
            className={cx(styles.studioDisplayContainer, { [styles.stacked]: studioModeStacked })}
          >
            <div
              className={cx(styles.studioEditorDisplayContainer, 'noselect')}
              style={{ cursor: v.cursor }}
              onMouseDown={eventHandlers.onMouseDown}
              onMouseUp={eventHandlers.onMouseUp}
              onMouseEnter={eventHandlers.onMouseEnter}
              onMouseMove={eventHandlers.onMouseMove}
              onDoubleClick={eventHandlers.onMouseDblClick}
              onContextMenu={eventHandlers.onContextMenu}
            >
              <Display
                drawUI={true}
                paddingSize={10}
                onOutputResize={eventHandlers.onOutputResize}
                renderingMode={ERenderingMode.OBS_MAIN_RENDERING}
                sourceId={v.studioMode ? studioModeTransitionName : undefined}
              />
            </div>
            {v.studioMode && (
              <div className={styles.studioModeDisplayContainer}>
                <Display paddingSize={10} />
              </div>
            )}
          </div>
        </div>
      )}
      {!displayEnabled && (
        <div className={styles.noPreview}>
          {v.performanceMode && (
            <div className={styles.message}>
              {$t('Preview is disabled in performance mode')}
              <div
                className={cx('button button--action', styles.button)}
                onClick={eventHandlers.enablePreview}
              >
                {$t('Disable Performance Mode')}
              </div>
            </div>
          )}
          {!v.performanceMode && (
            <div className={styles.placeholder} ref={placeholderRef}>
              {v.studioMode && (
                <div
                  className={cx(styles.placeholderControls, {
                    [styles.stacked]: studioModeStacked,
                  })}
                />
              )}
              <img
                src={require('../../../media/images/16x9.png')}
                className={cx({
                  [styles.vertical]: verticalPlaceholder,
                  [styles.stacked]: studioModeStacked,
                  [styles.studioMode]: v.studioMode,
                })}
              />
              {v.studioMode && (
                <img
                  src={require('../../../media/images/16x9.png')}
                  className={cx(
                    { [styles.vertical]: verticalPlaceholder, [styles.stacked]: studioModeStacked },
                    styles.right,
                    styles.studioMode,
                  )}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudioModeControls(p: { stacked: boolean }) {
  const { TransitionsService } = Services;

  return (
    <div className={cx(styles.studioModeControls, { [styles.stacked]: p.stacked })}>
      <span className={styles.studioModeControl}>{$t('Edit')}</span>
      <button
        className="button button--default"
        onClick={() => TransitionsService.actions.executeStudioModeTransition()}
      >
        {$t('Transition')}{' '}
        {p.stacked ? (
          <i className="fa fa-arrow-down" v-if="stacked" />
        ) : (
          <i className="fa fa-arrow-right" />
        )}
      </button>
      <span className={styles.studioModeControl}>{$t('Live')}</span>
    </div>
  );
}
