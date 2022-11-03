import React from 'react';
import { Menu, MenuItemProps, SubMenuProps } from 'antd';

interface ISubMenuProps extends SubMenuProps, MenuItemProps {
  title?: string;
}

export default function SubMenu(p: ISubMenuProps) {
  const { title } = p;
  return (
    <div title={title} className="submenu-wrapper">
      <Menu.SubMenu {...p}>{p.children}</Menu.SubMenu>
    </div>
  );
}
