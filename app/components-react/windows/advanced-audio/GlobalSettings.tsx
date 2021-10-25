import React, { useState, useRef, useMemo } from 'react';
import { Provider } from 'react-redux';
import {
  SliderInput,
  BoolButtonInput,
  ListInput,
  SwitchInput,
  NumberInput,
} from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { TObsValue, IObsListInput, IObsInput, TObsFormData } from 'components/obs/inputs/ObsInput';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { AudioSource } from 'services/audio';
import { Source } from 'services/sources';
import { $t } from 'services/i18n';
import Utils from 'services/utils';
import styles from './AdvancedAudio.m.less';
import { ObsSettings } from '../../windows/settings/ObsSettings';
import { store } from '../../store';

export default function GlobalSettings() {
  const { SettingsService } = Services;

  const { advancedAudioSettings } = useVuex(() => ({
    advancedAudioSettings: SettingsService.views.advancedAudioSettings,
  }));

  const monitoringDevice = advancedAudioSettings?.parameters[0] as IObsListInput<TObsValue>;
  const audioDucking = advancedAudioSettings?.parameters[1] as IObsInput<boolean>;

  return (
    <Provider store={store}>
      {monitoringDevice && (
        <ListInput
          label={monitoringDevice.description}
          value={monitoringDevice.value}
          options={monitoringDevice.options.map(opt => ({
            value: opt.value,
            label: opt.description,
          }))}
        />
      )}
      {audioDucking && <SwitchInput label={audioDucking.description} value={audioDucking.value} />}
      <ObsSettings page="Audio" />
    </Provider>
  );
}
