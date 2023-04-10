import React, { CSSProperties } from 'react';
import { $t } from 'services/i18n';
import { SwitchInput } from './inputs';
import { useVuex } from 'components-react/hooks';
import { Services } from '../service-provider';
import Tooltip from './Tooltip';

interface IDualOutputToggleProps {
  style?: CSSProperties;
}

export default function DualOutputToggle(p: IDualOutputToggleProps) {
  const { DualOutputService, SettingsManagerService } = Services;

  const v = useVuex(() => ({
    dualOutputMode: DualOutputService.views.dualOutputMode,
    toggleDualOutputMode: SettingsManagerService.actions.toggleDualOutputMode,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      {$t('Dual Output')}
      <Tooltip title={$t('Toggle to edit settings for both displays.')} lightShadow />
      <SwitchInput value={v.dualOutputMode} layout="horizontal" onChange={v.toggleDualOutputMode} />
    </div>
  );
}
