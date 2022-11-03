import React from 'react';
import { Menu, MenuItemProps, SubMenuProps } from 'antd';

type ISubMenuProps = Omit<SubMenuProps & MenuItemProps, 'title'> & {
  title?: string;
};

export default function SubMenu(p: ISubMenuProps) {
  const { title } = p;
  return (
    <div title={title} className="submenu-wrapper">
      <Menu.SubMenu {...p} title={title}>
        {p.children}
      </Menu.SubMenu>
    </div>
  );
}
