import React, { CSSProperties } from 'react';
import { Menu, MenuItemProps, SubMenuProps } from 'antd';
import styles from './SubMenu.m.less';
import cx from 'classnames';

interface ISubMenuProps extends SubMenuProps, MenuItemProps {
  title?: string;
  className?: string;
  style?: CSSProperties;
  applystyles?: boolean | number;
}

export default function SubMenu(p: ISubMenuProps) {
  const { title, style, applystyles = false } = p;

  return (
    <div title={title} className={cx(applystyles && styles.submenuWrapper)} style={style}>
      <Menu.SubMenu {...p} className={cx(p?.className)}>
        {p.children}
      </Menu.SubMenu>
    </div>
  );
}
