import React, { useState, useRef, useMemo } from 'react';
import { Provider } from 'react-redux';
import { BoolButtonInput, ListInput, SwitchInput } from 'components-react/shared/inputs';
import InputWrapper from 'components-react/shared/inputs/InputWrapper';
import Form from 'components-react/shared/inputs/Form';
import { TObsValue, IObsListInput, IObsInput } from 'components/obs/inputs/ObsInput';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { $t } from 'services/i18n';
import Utils from 'services/utils';
import styles from './AdvancedAudio.m.less';
import { ObsSettings } from '../../windows/settings/ObsSettings';
import { store } from '../../store';

export default function GlobalSettings() {
  const { SettingsService } = Services;

  const { advancedAudioSettings, isAdvancedOutput, recordingTracks } = useVuex(() => ({
    advancedAudioSettings: SettingsService.views.advancedAudioSettings,
    isAdvancedOutput: SettingsService.views.isAdvancedOutput,
    recordingTracks: SettingsService.views.recordingTracks,
  }));

  const monitoringDevice = advancedAudioSettings?.parameters[0] as IObsListInput<TObsValue>;
  const audioDucking = advancedAudioSettings?.parameters[1] as IObsInput<boolean>;
  const recTracks = Utils.numberToBinnaryArray(recordingTracks, 6).reverse();

  return (
    <>
      <Form>
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
        {audioDucking && (
          <SwitchInput label={audioDucking.description} value={audioDucking.value} />
        )}
        <InputWrapper
          label={$t('Audio Tracks')}
          tooltip={$t('Designates if this source is audible in your recorded track(s)')}
          layout="horizontal"
          style={{ flexWrap: 'nowrap' }}
        >
          <div style={{ display: 'flex' }}>
            {recTracks?.map((track, i) => (
              <BoolButtonInput
                label={String(i + 1)}
                key={i}
                value={!!track}
                checkboxStyles={{ marginRight: '4px' }}
                name={`flag${track}`}
              />
            ))}
          </div>
        </InputWrapper>
      </Form>
      <Provider store={store}>
        <ObsSettings page="Audio" />
      </Provider>
    </>
  );
}
