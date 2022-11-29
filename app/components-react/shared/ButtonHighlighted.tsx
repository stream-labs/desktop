import React, { CSSProperties, SVGProps } from 'react';
import { Button } from 'antd';
import cx from 'classnames';
import styles from './ButtonHighlighted.m.less';

interface IButtonHighlighted {
  icon?: SVGProps<SVGElement> | HTMLDivElement;
  className?: string;
  style?: CSSProperties;
  filled?: boolean;
  text: string;
  onClick?: () => void;
}

export default function ButtonHighlighted({
  icon,
  className,
  style,
  filled,
  text,
  onClick,
}: IButtonHighlighted) {
  return (
    <Button
      className={cx(styles.highlighted, className, filled && styles.filled)}
      style={style}
      onClick={onClick}
    >
      {icon}
      {text}
    </Button>
  );
}
