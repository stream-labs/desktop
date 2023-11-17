import React, { CSSProperties, SVGProps } from 'react';
import { Button, ButtonProps } from 'antd';
import cx from 'classnames';
import styles from './ButtonHighlighted.m.less';

interface IButtonHighlighted extends ButtonProps {
  icon?: SVGProps<SVGElement> | HTMLDivElement;
  className?: string;
  disabled?: boolean;
  style?: CSSProperties;
  filled?: boolean;
  faded?: boolean;
  text?: string;
  onClick?: () => void;
}

export default function ButtonHighlighted(p: IButtonHighlighted) {
  return (
    <Button
      className={cx(
        styles.highlighted,
        p.className,
        p.filled && styles.filled,
        p.faded && styles.faded,
      )}
      style={p.style}
      onClick={p.onClick}
      disabled={p.disabled}
    >
      {p.icon}
      {p.text}
      {p.children}
    </Button>
  );
}
