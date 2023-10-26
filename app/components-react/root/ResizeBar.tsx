import React, { useState, useRef } from 'react';
import { Resizable, ResizableProps } from 'react-resizable';
import cx from 'classnames';
import styles from './ResizeBar.m.less';

interface ResizeBarProps {
  // the side of the external container to stick ResizeBar to
  position: 'left' | 'right' | 'top';
  value: number;
  min: number;
  max: number;
  onResizestart: (offset?: number) => void;
  onResizestop: (offset?: number) => void;
  onInput: (val: number) => void;
}

interface ResizableData {
  size: {
    height: number;
    width: number;
  };
}

/**
 * This component can be added to any element as a resize control
 */
export default function ResizeBar(p: React.PropsWithChildren<ResizeBarProps>) {
  let resizableProps: ResizableProps;

  if (p.position === 'top') {
    resizableProps = {
      width: Infinity,
      height: p.value,
      resizeHandles: ['n'],
      minConstraints: [Infinity, p.min],
      maxConstraints: [Infinity, p.max],
      axis: 'y',
    };
  } else {
    resizableProps = {
      height: Infinity,
      width: p.value,
      resizeHandles: p.position === 'left' ? ['w'] : ['e'],
      minConstraints: [p.min, Infinity],
      maxConstraints: [p.max, Infinity],
      axis: 'x',
    };
  }

  function handleResize(callback: (val?: number) => void) {
    return (e: React.SyntheticEvent, data: ResizableData) => {
      const value = p.position === 'top' ? data.size.height : data.size.width;
      callback(value);
    };
  }

  return (
    <Resizable
      onResizeStart={handleResize(p.onResizestart)}
      onResizeStop={handleResize(p.onResizestop)}
      onResize={handleResize(p.onInput)}
      transformScale={2}
      {...resizableProps}
      handle={
        <div className={cx(styles.resizeBar, styles[p.position])}>
          <div className={styles.resizeLine} />
        </div>
      }
    >
      {p.children}
    </Resizable>
  );
}
