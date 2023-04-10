import React, { CSSProperties } from 'react';
import { $t } from 'services/i18n';
import { SwitchInput } from './inputs';
import { useVuex } from 'components-react/hooks';
import { Services } from '../service-provider';
import Tooltip from './Tooltip';
import Tabs from './Tabs';

interface IOutputSettingsHeaderProps {
  style?: CSSProperties;
}

export default function OutputSettingsHeader(p: IOutputSettingsHeaderProps) {
  const { DualOutputService, SettingsManagerService } = Services;

  const v = useVuex(() => ({
    dualOutputMode: DualOutputService.views.dualOutputMode,
    toggleDualOutputMode: SettingsManagerService.actions.toggleDualOutputMode,
  }));

  return (
    <>
      <h2>{$t('Output')}</h2>

      <div style={{ display: 'flex', flexDirection: 'row' }}>
        {$t('Dual Output')}
        <Tooltip title={$t('Dual Output')} lightShadow />
        <SwitchInput
          value={v.dualOutputMode}
          layout="horizontal"
          onChange={v.toggleDualOutputMode}
        />
      </div>

      <Tabs />
    </>
  );
}
