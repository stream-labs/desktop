import React from 'react';
import { Button } from 'antd';
import { ObsSettingsSection } from './ObsSettings';
import { Services } from '../../service-provider';
import { alertAsync } from '../../modals';

export function ExperimentalSettings() {
  const { ScenesService, WindowsService } = Services;

  function repairSceneCollection() {
    ScenesService.repair();
    alertAsync('Repair finished. See details in the log file');
  }

  function showDemoComponents() {
    WindowsService.showWindow({
      title: 'Shared React Components',
      componentName: 'SharedComponentsLibrary',
      size: { width: 1000, height: 1000 },
    });
  }

  return (
    <ObsSettingsSection>
      <div>
        <Button onClick={repairSceneCollection}>Repair Scene Collection</Button>
        <br />
        <br />
        <br />
        <Button type="primary" onClick={showDemoComponents}>
          Show Shared Components Library
        </Button>
        <br />
        <br />
      </div>
    </ObsSettingsSection>
  );
}

ExperimentalSettings.page = 'Experimental';
