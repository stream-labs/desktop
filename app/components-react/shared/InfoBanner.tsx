import React, { CSSProperties } from 'react';
import styles from './InfoBanner.m.less';
import cx from 'classnames';

interface IInfoBannerProps {
  message: string;
  type?: 'info' | 'warning';
  style?: CSSProperties;
  className?: string;
}

export default function InfoBanner(p: IInfoBannerProps) {
  return (
    <div
      className={cx(
        styles.infoBanner,
        { [styles.info]: p.type === 'info' },
        { [styles.warning]: p.type === 'warning' },
        p.className,
      )}
      style={p.style ?? undefined}
    >
      <i className="icon-information" />
      <span className="message">{p.message}</span>
    </div>
  );
}
