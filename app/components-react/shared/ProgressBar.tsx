import React, { CSSProperties, useMemo } from 'react';
import { Progress } from 'antd';
import styles from './ProgressBar.m.less';
import cx from 'classnames';

interface IProgressBarProps {
  className?: string;
  style?: CSSProperties;
  current: number;
  total: number;
}

export default function ProgressBar(p: IProgressBarProps) {
  const percent = useMemo(() => {
    return Math.floor((p.current / p.total) * 100);
  }, [p.current]);

  return <Progress className={cx(styles.progressBar, p.className)} percent={percent} />;
}
