import React, { useEffect, useState } from 'react';
import { Menu, message } from 'antd';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import SourceSettings from './SourceSettings';
import GlobalSettings from './GlobalSettings';
import { $t } from 'services/i18n';

export default function AdvancedAudio() {
  const [activeTab, setActiveTab] = useState('source');
  const { SettingsService, UserService } = Services;

  const { streamTrack, vodTrack, vodTrackEnabled } = useVuex(() => ({
    streamTrack: SettingsService.views.streamTrack,
    vodTrack: SettingsService.views.vodTrack,
    vodTrackEnabled: SettingsService.views.vodTrackEnabled,
  }));

  useEffect(() => {
    if (!vodTrackEnabled) return;
    if (streamTrack === vodTrack) {
      message.error(
        $t(
          'Your Stream and VOD Track are the same. This may result in unexpected audio behavior, go to Global Settings to change.',
        ),
        0,
      );
    } else {
      message.destroy();
    }
  }, [streamTrack, vodTrack]);

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
      <Scrollable style={{ height: 'calc(100% - 46px)' }} snapToWindowEdge>
        {activeTab === 'source' && <SourceSettings />}
        {activeTab === 'global' && <GlobalSettings />}
      </Scrollable>
    </ModalLayout>
  );
}
