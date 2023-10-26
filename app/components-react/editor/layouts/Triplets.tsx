import React, { useRef } from 'react';
import cx from 'classnames';
import useLayout, { LayoutProps } from './hooks';
import ResizeBar from 'components-react/root/ResizeBar';
import styles from './Layouts.m.less';

export function Triplets(p: React.PropsWithChildren<LayoutProps>) {
  const componentRef = useRef<HTMLDivElement>(null);

  const { mins, bars, resizes, calculateMax, setBar } = useLayout(
    componentRef.current,
    [
      ['1', '4'],
      ['2', '5'],
      ['3', '6'],
    ],
    true,
    p.childrenMins,
    p.onTotalWidth,
  );

  function StackedSection(props: { slots: string[]; width: string }) {
    return (
      <div className={styles.stacked} style={{ width: props.width }}>
        {props.slots.map(slot => (
          <div key={slot} className={styles.cell}>
            {p.children![slot]}
          </div>
        ))}
      </div>
    );
  }

  if (!resizes.bar2 || !mins.bar2) return <></>;

  return (
    <div className={cx(styles.columns, styles.sidePadded)} ref={componentRef}>
      <ResizeBar
        position="right"
        value={bars.bar1}
        onInput={(value: number) => setBar('bar1', value)}
        max={calculateMax(mins.rest + bars.bar2)}
        min={mins.bar1}
      >
        <StackedSection
          slots={['1', '4']}
          width={`${100 - (resizes.bar1 + resizes.bar2) * 100}%`}
        />
      </ResizeBar>
      <StackedSection slots={['2', '5']} width={`${resizes.bar1 * 100}%`} />
      <ResizeBar
        position="left"
        value={bars.bar2}
        onInput={(value: number) => setBar('bar2', value)}
        max={calculateMax(mins.rest + mins.bar1)}
        min={mins.bar2}
      >
        <StackedSection slots={['3', '6']} width={`${resizes.bar2 * 100}%`} />
      </ResizeBar>
    </div>
  );
}
