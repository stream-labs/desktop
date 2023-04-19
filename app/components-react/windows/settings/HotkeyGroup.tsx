import React, { useState } from 'react';
import { Collapse } from 'antd';
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

interface HeaderProps extends CommonProps {}

const { Panel } = Collapse;

const getHotkeyUniqueId = (hotkey: IHotkey) => {
  return hotkey.actionName + hotkey.sceneId + hotkey.sceneItemId + hotkey.sourceId;
};

function Header({ title }: HeaderProps) {
  return (
    <h2
      className="section-title section-title--dropdown"
      style={{ display: 'inline-block', verticalAlign: '-2px' }}
    >
      {title}
    </h2>
  );
}

export default function HotkeyGroup(props: HotkeyGroupProps) {
  const { hotkeys, title, isSearch } = props;
  const isCollapsible = !!(title && !isSearch);

  const headerProps = { title };

  const header = <Header {...headerProps} />;
  const hotkeyContent = (
    <div className={cx({ 'section-content--opened': !!title }, 'section-content')}>
      {hotkeys.map(hotkey => (
        <div key={getHotkeyUniqueId(hotkey)}>
          <Hotkey hotkey={hotkey} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="section">
      {!isCollapsible ? (
        hotkeyContent
      ) : (
        <Collapse
          expandIcon={({ isActive }) => (
            <i
              className={cx('fa', 'section-title-icon', {
                'fa-minus': isActive,
                'fa-plus': !isActive,
              })}
            />
          )}
        >
          <Panel header={header} key="1">
            {hotkeyContent}
          </Panel>
        </Collapse>
      )}
    </div>
  );
}
