import React, { useEffect, useState } from 'react';
import { $t } from 'services/i18n';
import styles from './BaseElement.m.less';
import Scrollable from 'components-react/shared/Scrollable';
import { useModule } from '../../hooks/useModule';
import { mutation } from '../../store';

class BaseElementModule {
  state = {
    sizeWatcherCallbacks: [] as Function[],
    sizeWatcherInterval: 0,
  };

  @mutation()
  addSizeWatcher(cb: Function) {
    this.state.sizeWatcherCallbacks = [...this.state.sizeWatcherCallbacks, cb];
    if (this.state.sizeWatcherInterval) return;
    this.state.sizeWatcherInterval = window.setInterval(() => {
      this.state.sizeWatcherCallbacks.forEach(cb => cb());
    }, 500);
  }

  @mutation()
  removeSizeWatcher(cb: Function) {
    const idx = this.state.sizeWatcherCallbacks.findIndex(func => func === cb);
    if (idx !== -1) this.state.sizeWatcherCallbacks.splice(idx, 1);
  }
}

export default function useBaseElement(element: React.ReactNode, mins: IVec2, ref: HTMLDivElement) {
  const [belowMins, setBelowMins] = useState(false);
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);

  const { addSizeWatcher, removeSizeWatcher } = useModule(BaseElementModule).select();

  useEffect(() => {
    const sizeWatcher = () => {
      if (!ref.getBoundingClientRect) return;
      setHeight(ref.getBoundingClientRect().height);
      setWidth(ref.getBoundingClientRect().width);
    };

    sizeWatcher();
    addSizeWatcher(sizeWatcher);

    return () => removeSizeWatcher(sizeWatcher);
  }, []);

  useEffect(() => {
    if (!ref) return;
    // 26px added to account for size of the resize bars and padding
    setBelowMins(height + 26 < mins.y || width + 26 < mins.x);
  }, [width, height]);

  function renderElement() {
    return belowMins ? <BelowMinWarning /> : element;
  }

  return renderElement;
}

function BelowMinWarning() {
  return (
    <Scrollable className={styles.container}>
      <span className={styles.empty}>{$t('This element is too small to be displayed')}</span>
    </Scrollable>
  );
}
