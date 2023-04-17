import React, { useState } from 'react';
import Animate from 'rc-animate';
import cx from 'classnames';
import { IHotkey } from 'services/hotkeys';
import Hotkey from './Hotkey';

interface CommonProps {
  title: string | null;
}

interface HotkeyGroupProps extends CommonProps {
  hotkeys: IHotkey[];
  isSearch: boolean;
}

interface HeaderProps extends CommonProps {
  isCollapsible: boolean;
  collapsed: boolean;
  handleClick: () => void;
}

const getHotkeyUniqueId = (hotkey: IHotkey) => {
  return hotkey.actionName + hotkey.sceneId + hotkey.sceneItemId + hotkey.sourceId;
};

function Header({ title, isCollapsible, collapsed, handleClick }: HeaderProps) {
  return title ? (
    <h2 className="section-title section-title--dropdown" onClick={handleClick}>
      {isCollapsible && collapsed ? <i className="fa fa-plus section-title__icon" /> : null}
      {isCollapsible && !collapsed ? <i className="fa fa-minus section-title__icon" /> : null}
      {title}
    </h2>
  ) : null;
}

export default function HotkeyGroup(props: HotkeyGroupProps) {
  const { hotkeys, title, isSearch } = props;
  const [collapsed, setCollapsed] = useState(true);
  const isCollapsible = !!(title && !isSearch);

  const toggleCollapsed = () => {
    setCollapsed(collapsed => !collapsed);
  };

  const headerProps = { title, isCollapsible, collapsed, handleClick: toggleCollapsed };

  return (
    <div className="section">
      <Header {...headerProps} />
      {/* TODO: not sure whether this matches Vue's expand */}
      <Animate transitionName="slidedown">
        {(!isCollapsible || !collapsed) && (
          <div className={cx({ 'section-content--opened': !!title }, 'section-content')}>
            {hotkeys.map(hotkey => (
              <div key={getHotkeyUniqueId(hotkey)}>
                <Hotkey hotkey={hotkey} />
              </div>
            ))}
          </div>
        )}
      </Animate>
    </div>
  );
}
