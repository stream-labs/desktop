import React, { CSSProperties } from 'react';
import { Menu, MenuItemProps, SubMenuProps } from 'antd';

interface ISubMenuProps extends SubMenuProps, MenuItemProps {
  title?: string;
  style?: CSSProperties;
}

export default function SubMenu(p: ISubMenuProps) {
  const { title } = p;
  return (
    <div title={title} className="submenu-wrapper" style={p.style}>
      <Menu.SubMenu {...p}>{p.children}</Menu.SubMenu>
    </div>
  );
}
