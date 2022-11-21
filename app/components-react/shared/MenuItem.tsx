import React, { CSSProperties } from 'react';
import { Menu, MenuItemProps } from 'antd';
import styles from './MenuItem.m.less';
import cx from 'classnames';

interface IMenuProps extends MenuItemProps {
  title?: string;
  className?: string;
  style?: CSSProperties;
  applystyles?: boolean | number;
}

export default function Menutem(p: IMenuProps) {
  const { title, style, applystyles = false } = p;

  return (
    <div title={title} className={cx(applystyles && styles.menuitemWrapper)} style={style}>
      <Menu.Item {...p} className={cx(p?.className)} title={false}>
        {p.children}
      </Menu.Item>
    </div>
  );
}
