import React, { useState } from 'react';
import { Menu } from 'antd';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import Scrollable from 'components-react/shared/Scrollable';
import SourceSettings from './SourceSettings';
import GlobalSettings from './GlobalSettings';
import { $t } from 'services/i18n';

export default function AdvancedAudio() {
  const [activeTab, setActiveTab] = useState('source');

  return (
    <ModalLayout hideFooter>
      <Menu
        onClick={e => setActiveTab(e.key)}
        selectedKeys={[activeTab]}
        mode="horizontal"
        style={{ marginBottom: '16px' }}
      >
        <Menu.Item key="source">{$t('Source Settings')}</Menu.Item>
        <Menu.Item key="global">{$t('Global Settings')}</Menu.Item>
      </Menu>
      <Scrollable style={{ height: '100%' }} snapToWindowEdge>
        {activeTab === 'source' && <SourceSettings />}
        {activeTab === 'global' && <GlobalSettings />}
      </Scrollable>
    </ModalLayout>
  );
}
