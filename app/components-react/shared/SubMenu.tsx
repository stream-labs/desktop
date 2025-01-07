import React, { CSSProperties } from 'react';
import { Menu, MenuItemProps, SubMenuProps } from 'antd';
import styles from './SubMenu.m.less';
import cx from 'classnames';
import MenuItem from './MenuItem';
import { Services } from 'components-react/service-provider';
import { EMenuItemKey } from 'services/side-nav';

interface ISubMenuProps extends SubMenuProps, MenuItemProps {
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export default function SubMenu(p: ISubMenuProps) {
  const { title, style } = p;

  const { NavigationService } = Services;

  return (
    <div title={title} className={styles.submenuWrapper} style={style}>
      {/* submenu: {title} */}
      <Menu.SubMenu {...p} className={cx(p?.className)}>
        {p.children}
      </Menu.SubMenu>

      {/* TODO: Below should only be displayed if Ai highlighter is installed. 
Needs to be differently handled bcs it is not a web app like the app store apps  */}
      <Menu.Item
        key="Ai Highlighter"
        onClick={() => {
          NavigationService.actions.navigate(
            'Highlighter',
            { view: 'settings' },
            EMenuItemKey.Highlighter,
          );
        }}
      >
        AI Highlighter
      </Menu.Item>
    </div>
  );
}
