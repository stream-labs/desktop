import React, { CSSProperties } from 'react';
import { Menu, MenuItemProps, SubMenuProps } from 'antd';
import styles from './SubMenu.m.less';

interface ISubMenuProps extends SubMenuProps, MenuItemProps {
  title?: string;
  style?: CSSProperties;
  applystyles?: boolean;
}

export default function SubMenu(p: ISubMenuProps) {
  const { title, style, applystyles } = p;

  return (
    <div title={title} className={applystyles && styles.submenuWrapper} style={style}>
      <Menu.SubMenu {...p}>{p.children}</Menu.SubMenu>
    </div>
  );
}
