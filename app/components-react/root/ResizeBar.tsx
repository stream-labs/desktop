import React, { useState, useRef } from 'react';
import cx from 'classnames';
import styles from './ResizeBar.m.less';

interface ResizeBarProps {
  // the side of the external container to stick ResizeBar to
  position: 'left' | 'right' | 'top';
  value: number;
  min: number;
  max: number;
  // by default ResizeBar increases the value when move to bottom/right
  // and decreases when move to left/top
  // change this option to reverse this behavior
  reverse: boolean;
  onResizestart: (offset?: number) => void;
  onResizestop: (offset?: number) => void;
  onInput: (val: number) => void;
}

/**
 * This component can be added to any element as a resize control
 */
export default function ResizeBar(p: ResizeBarProps) {
  const [active, setActive] = useState(false);
  const [transform, setTransform] = useState(''); // css-transform prop ResizeBar

  const barRef = useRef<HTMLDivElement>(null);

  let barOffset = 0;
  let mouseInitial = 0;

  const hasConstraints = p.max !== Infinity || p.min !== -Infinity;
  const isHorizontal = ['left', 'right'].includes(p.position);

  function onMouseDownHandler(event: React.MouseEvent) {
    // Handle cases where the window size is too small to allow resizing
    if (p.max <= p.min) return;
    startMouseTracking(event);
  }

  function startMouseTracking(event: React.MouseEvent) {
    if (!barRef.current) return;
    setActive(true);
    const mouseMoveListener = (event: React.MouseEvent) => onMouseMoveHandler(event);
    barRef.current.addEventListener('mousemove', mouseMoveListener);
    barRef.current.addEventListener(
      'mouseup',
      (event: React.MouseEvent) => {
        if (!barRef.current) return;
        barRef.current.removeEventListener('mousemove', mouseMoveListener);
        stopMouseTracking(event);
      },
      { once: true },
    );
    barRef.current.addEventListener(
      'mouseleave',
      (event: React.MouseEvent) => {
        if (!barRef.current) return;
        barRef.current.removeEventListener('mousemove', mouseMoveListener);
        stopMouseTracking(event);
      },
      { once: true },
    );

    mouseInitial = isHorizontal ? event.pageX : event.pageY;
    p.onResizestart();
  }

  function stopMouseTracking(event: React.MouseEvent) {
    setActive(false);
    let offset = barOffset;
    if (p.reverse) offset = -offset;
    barOffset = 0;
    mouseInitial = 0;
    updateTransform();
    p.onResizestop(offset);
    p.onInput(offset + p.value);
  }

  function onMouseMoveHandler(event: React.MouseEvent) {
    const mouseOffset = (isHorizontal ? event.pageX : event.pageY) - mouseInitial;

    // handle max and min constraints
    if (hasConstraints) {
      const value = p.reverse ? p.value - mouseOffset : p.value + mouseOffset;

      if (value > p.max) {
        barOffset = p.reverse ? p.value - p.max : p.max - p.value;
      } else if (value < p.min) {
        barOffset = p.reverse ? p.value - p.min : p.min - p.value;
      } else {
        barOffset = mouseOffset;
      }
    } else {
      barOffset = mouseOffset;
    }

    updateTransform();
  }

  function updateTransform() {
    setTransform(isHorizontal ? `translateX(${barOffset}px)` : `translateY(${barOffset}px)`);
  }

  return (
    <div
      ref={barRef}
      className={cx(styles.resizeBar, styles[p.position], { [styles.active]: active })}
      style={{ transform }}
      onMouseDown={onMouseDownHandler}
    >
      <div className={styles.resizeLine} />
    </div>
  );
}
