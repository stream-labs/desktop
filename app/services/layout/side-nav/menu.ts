import { TAppPage } from 'services/navigation';

export interface IMenu {
  name: string;
  isOpen: boolean;
  isLegacy: boolean; // Users created after sidebar navigation refactor will see fewer menu items
  menuItems: (IMenuItem | IParentMenuItem)[];
}

export interface IMenuItem {
  target?: TAppPage; // optional because menu item could be a toggle
  title: string;
  trackingTarget?: string;
  icon?: string;
  svgIcon?: boolean; // TODO: Remove after converting Highlighter to font icon
  isActive?: boolean;
  isLegacy?: boolean;
}

export interface IParentMenuItem extends IMenuItem {
  isExpanded?: boolean;
  isToggled?: boolean;
  isEditor?: boolean;
  subMenuItems: IMenuItem[];
}
