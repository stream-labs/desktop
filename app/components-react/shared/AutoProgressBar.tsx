import { Progress } from 'antd';
import React, { useEffect, useState } from 'react';

/**
 * A progress bar that automatically increments itself in the
 * absence of progress updates.
 * @param p.percent current percent of the progress bar
 * @param p.timeTarget the time it takes to reach 100% in ms
 */
export default function AutoProgressBar(p: { percent: number; timeTarget: number }) {
  const [renderedPercent, setRenderedPercent] = useState(0);

  useEffect(() => {
    let currentPercent = p.percent;
    const incrementPeriod = 300;
    const incrementVal = (incrementPeriod / p.timeTarget) * 100;
    const interval = window.setInterval(() => {
      currentPercent = Math.min(100, currentPercent + incrementVal);
      setRenderedPercent(currentPercent);
    }, incrementPeriod);

    return () => clearInterval(interval);
  }, [p.percent]);

  return <Progress percent={renderedPercent} status="active" format={p => `${p?.toFixed(0)}%`} />;
}
