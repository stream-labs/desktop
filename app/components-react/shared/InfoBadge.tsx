import React, { CSSProperties } from 'react';
import styles from './InfoBadge.m.less';
import { $t } from 'services/i18n';
import cx from 'classnames';

interface IInfoBadge {
  content: string | React.ReactElement;
  className?: string;
  style?: CSSProperties;
  hasMargin?: boolean;
}

export default function InfoBadge(p: IInfoBadge) {
  return (
    <div
      className={cx(styles.infoBadge, p.hasMargin && styles.margin, p.className)}
      style={p.style}
    >
      {typeof p.content === 'string' ? $t(p.content) : p.content}
    </div>
  );
}
