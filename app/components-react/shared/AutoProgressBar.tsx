import { Progress } from 'antd';
import React, { useEffect, useState } from 'react';

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

  return <Progress percent={renderedPercent} status="active" />;
}
