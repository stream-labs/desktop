import React, { useRef } from 'react';
import cx from 'classnames';
import useLayout, { LayoutProps } from './hooks';
import ResizeBar from 'components-react/root/ResizeBar';
import styles from './Layouts.m.less';

export function FourByFour(p: React.PropsWithChildren<LayoutProps>) {
  const componentRef = useRef<HTMLDivElement>(null);

  const { mins, bars, resizes, calculateMax, setResizing, setBar } = useLayout(
    componentRef.current,
    ['1', ['2', '3'], ['4', '5']],
    false,
    p.childrenMins,
    p.onTotalWidth,
  );

  if (!mins.bar2 || !resizes.bar2) {
    return <></>;
  }

  return (
    <div className={styles.rows}>
      <div
        className={styles.cell}
        style={{ height: `${100 - (resizes.bar1 + resizes.bar2) * 100}%` }}
      >
        {p.children!['1']}
      </div>
      <ResizeBar
        position="top"
        value={bars.bar1}
        onInput={(value: number) => setBar('bar1', value)}
        onResizestart={() => setResizing(true)}
        onResizestop={() => setResizing(false)}
        max={calculateMax(mins.rest + bars.bar2)}
        min={mins.bar1}
      />
      <div className={styles.segmented} style={{ height: `${resizes.bar1 * 100}%` }}>
        <div className={cx(styles.cell, 'no-top-padding')}>{p.children!['2']}</div>
        <div className={cx(styles.cell, 'no-top-padding')}>{p.children!['3']}</div>
      </div>
      <ResizeBar
        position="top"
        value={bars.bar2}
        onInput={(value: number) => setBar('bar2', value)}
        onResizestart={() => setResizing(true)}
        onResizestop={() => setResizing(false)}
        max={calculateMax(mins.rest + mins.bar1)}
        min={mins.bar2}
      />
      <div
        className={styles.segmented}
        style={{ height: `${resizes.bar2 * 100}%`, padding: '0 8px' }}
      >
        <div className={cx(styles.cell, 'no-top-padding')}>{p.children!['4']}</div>
        <div className={cx(styles.cell, 'no-top-padding')}>{p.children!['5']}</div>
      </div>
    </div>
  );
}
