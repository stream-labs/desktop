import React from 'react';
import { IObsFormType, ObsGenericSettingsForm } from './ObsSettings';
import { useObsSettings } from './useObsSettings';

export function OutputSettings() {
  const { settingsFormData } = useObsSettings();

  const type = settingsFormData[0].parameters[0].currentValue === 'Simple' ? 'collapsible' : 'tabs';

  return <ObsGenericSettingsForm type={type as IObsFormType} />;
}

OutputSettings.page = 'Output';
