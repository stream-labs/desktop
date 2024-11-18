import React from 'react';
import cx from 'classnames';
import useLayout, { LayoutProps } from './hooks';
import ResizeBar from 'components-react/root/ResizeBar';
import styles from './Layouts.m.less';

export function Pyramid(p: React.PropsWithChildren<LayoutProps>) {
  const { mins, bars, resizes, calculateMax, setBar, componentRef } = useLayout(
    [['1'], ['2', '3']],
    false,
    p.childrenMins,
    p.onTotalWidth,
  );

  return (
    <div className={styles.rows} ref={componentRef}>
      <div className={styles.cell} style={{ height: `${100 - resizes.bar1 * 100}%` }}>
        {
          // TODO: index
          // @ts-ignore
          p.children?.['1'] || <></>
        }
      </div>
      <ResizeBar
        position="top"
        value={bars.bar1}
        onInput={(value: number) => setBar('bar1', value)}
        max={calculateMax(mins.rest)}
        min={mins.bar1}
      >
        <div
          className={styles.segmented}
          style={{ height: `${resizes.bar1 * 100}%`, padding: '0 8px' }}
        >
          {['2', '3'].map(slot => (
            <div className={cx(styles.cell, 'no-top-padding')} key={slot}>
              {
                // TODO: index
                // @ts-ignore
                p.children?.[slot] || <></>
              }
            </div>
          ))}
        </div>
      </ResizeBar>
    </div>
  );
}
