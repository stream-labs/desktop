import React, { MouseEvent } from 'react';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';
import { ERenderingMode } from '../../../obs-api';
import Display from 'components-react/shared/Display';
import Spinner from 'components-react/shared/Spinner';
import styles from '../root/StudioEditor.m.less';
import cx from 'classnames';

interface IDisplayEventHandlers {
  onOutputResize: (rect: IRectangle) => void;
  onMouseDown: (event: MouseEvent) => void;
  onMouseUp: (event: MouseEvent) => void;
  onMouseEnter: (event: MouseEvent) => void;
  onMouseDblClick: (event: MouseEvent) => void;
  onMouseMove: (event: MouseEvent) => void;
  enablePreview: () => void;
  onContextMenu: (event: MouseEvent) => void;
}

export default function DualOutputDisplay(p: { eventHandlers: IDisplayEventHandlers }) {
  const { DualOutputService, EditorService, ScenesService } = Services;
  const v = useVuex(() => ({
    activeSceneId: ScenesService.views.activeSceneId,
    hasDualOutputScenes: DualOutputService.views.hasDualOutputScenes,
    cursor: EditorService.state.cursor,
  }));

  return v.hasDualOutputScenes ? (
    <>
      <div
        className={cx(styles.dualOutputDisplayContainer)}
        style={{ cursor: v.cursor }}
        onMouseDown={p.eventHandlers.onMouseDown}
        onMouseUp={p.eventHandlers.onMouseUp}
        onMouseEnter={p.eventHandlers.onMouseEnter}
        onMouseMove={p.eventHandlers.onMouseMove}
        onDoubleClick={p.eventHandlers.onMouseDblClick}
        onContextMenu={p.eventHandlers.onContextMenu}
      >
        <Display
          type="horizontal"
          drawUI={true}
          paddingSize={10}
          paddingColor={{ r: 255, g: 238, b: 0 }} // @@@ temp
          onOutputResize={p.eventHandlers.onOutputResize}
          renderingMode={ERenderingMode.OBS_MAIN_RENDERING}
        />
      </div>

      <div
        className={cx(styles.dualOutputDisplayContainer)}
        style={{ cursor: v.cursor }}
        onMouseDown={p.eventHandlers.onMouseDown}
        onMouseUp={p.eventHandlers.onMouseUp}
        onMouseEnter={p.eventHandlers.onMouseEnter}
        onMouseMove={p.eventHandlers.onMouseMove}
        onDoubleClick={p.eventHandlers.onMouseDblClick}
        onContextMenu={p.eventHandlers.onContextMenu}
      >
        <Display
          type="vertical"
          drawUI={true}
          paddingSize={10}
          paddingColor={{ r: 255, g: 0, b: 0 }} // @@@ temp
          onOutputResize={p.eventHandlers.onOutputResize}
          renderingMode={ERenderingMode.OBS_MAIN_RENDERING}
        />
      </div>
    </>
  ) : (
    <Spinner visible={true} />
  );
}
