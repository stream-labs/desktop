import React, { useRef } from 'react';
import cx from 'classnames';
import useLayout, { LayoutProps, ILayoutSlotArray } from './hooks';
import ResizeBar from 'components-react/root/ResizeBar';
import styles from './Layouts.m.less';

export function Classic(p: React.PropsWithChildren<LayoutProps>) {
  const componentRef = useRef<HTMLDivElement>(null);

  const { mins, bars, resizes, calculateMax, setResizing, setBar } = useLayout(
    componentRef.current,
    ['1', ['2', '3', '4']],
    false,
    p.childrenMins,
    p.onTotalWidth,
  );

  function LayoutBody() {
    if (!p.children || !bars.bar1 || !mins.bar1 || !mins.rest) return <>Hello World</>;

    return (
      <>
        <div className={styles.cell} style={{ height: `${100 - resizes.bar1 * 100}%` }}>
          {p.children['1']}
        </div>
        <ResizeBar
          position="top"
          value={bars.bar1}
          onInput={(value: number) => setBar('bar1', value)}
          onResizestart={() => setResizing(true)}
          onResizestop={() => setResizing(false)}
          max={calculateMax(mins.rest)}
          min={mins.bar1}
          reverse={true}
        />
        <div
          className={styles.segmented}
          style={{ height: `${resizes.bar1 * 100}%`, padding: '0 8px' }}
        >
          {['2', '3', '4'].map(slot => (
            <div className={cx(styles.cell, 'no-top-padding')}>{p.children![slot]}</div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className={styles.rows} ref={componentRef}>
      <LayoutBody />
    </div>
  );
}
