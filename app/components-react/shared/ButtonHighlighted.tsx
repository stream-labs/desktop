import React, { CSSProperties, SVGProps } from 'react';
import { Button } from 'antd';
import cx from 'classnames';
import styles from './ButtonHighlighted.m.less';
import { IconFontProps } from '@ant-design/icons/lib/components/IconFont';

interface IButtonHighlighted {
  icon?: SVGProps<SVGElement> | HTMLDivElement;
  className?: string;
  style?: CSSProperties;
  text: string;
  onClick?: () => void;
}

export default function ButtonHighlighted({
  icon,
  className,
  style,
  text,
  onClick,
}: IButtonHighlighted) {
  return (
    <Button className={cx(styles.highlighted, className)} style={style} onClick={onClick}>
      {icon}
      {text}
    </Button>
  );
}
