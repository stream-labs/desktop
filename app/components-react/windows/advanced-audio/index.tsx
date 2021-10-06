import React, { useState } from 'react';
import { Menu } from 'antd';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import SourceSettings from './SourceSettings';
import GlobalSettings from './GlobalSettings';

export default function AdvancedAudio() {
  const [activeTab, setActiveTab] = useState('source');

  return (
    <ModalLayout hideFooter>
      {activeTab === 'source' && <SourceSettings />}
      {activeTab === 'global' && <GlobalSettings />}
    </ModalLayout>
  );
}
