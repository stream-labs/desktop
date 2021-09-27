import React, { useState, useRef, useMemo } from 'react';
import { Collapse } from 'antd';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import {
  SliderInput,
  BoolButtonInput,
  ListInput,
  SwitchInput,
} from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { TObsValue, IObsListInput, TObsFormData } from 'components/obs/inputs/ObsInput';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { AudioSource } from 'services/audio';
import { Source } from 'services/sources';
import { $t } from 'services/i18n';
import Utils from 'services/utils';
import styles from './AdvancedAudio.m.less';

const { Panel } = Collapse;

export default function AdvancedAudio() {
  const { AudioService, WindowsService } = Services;

  const initialSource = useMemo<string>(
    () => WindowsService.getChildWindowQueryParams().sourceId || '',
    [],
  );
  const [expandedSource, setExpandedSource] = useState(initialSource);

  const { audioSources } = useVuex(() => ({
    audioSources: AudioService.views.sourcesForCurrentScene,
  }));

  return (
    <ModalLayout hideFooter>
      <Collapse
        accordion
        activeKey={expandedSource}
        onChange={(key: string) => setExpandedSource(key)}
        expandIcon={({ isActive }) => <i className={isActive ? 'icon-subtract' : 'icon-add'} />}
      >
        {audioSources.map(audioSource => (
          <Panel key={audioSource.sourceId} header={<PanelHeader source={audioSource} />}>
            <PanelForm source={audioSource} />
          </Panel>
        ))}
      </Collapse>
    </ModalLayout>
  );
}

function PanelHeader(p: { source: AudioSource }) {
  const { name, mixerHidden, muted, fader, sourceId, audioMixers } = p.source;
  const { EditorCommandsService, SettingsService } = Services;
  const { isAdvancedOutput, recordingTracks, streamTrack } = useVuex(() => ({
    isAdvancedOutput: SettingsService.views.isAdvancedOutput,
    streamTrack: SettingsService.views.streamTrack,
    recordingTracks: SettingsService.views.recordingTracks,
  }));

  const [trackFlags, setTrackFlags] = useState(Utils.numberToBinnaryArray(audioMixers, 6));

  function onTrackInput(index: number | undefined) {
    return (value: boolean) => {
      const bitwise = value ? 1 : 0;
      setTrackFlags(trackFlags.map((el, i) => (i === index ? bitwise : el)));
      const newValue = Utils.binnaryArrayToNumber(trackFlags.reverse());
      EditorCommandsService.actions.executeCommand('SetAudioSettingsCommand', sourceId, {
        audioMixers: newValue,
      });
    };
  }

  function onDeflectionInput(value: number) {
    EditorCommandsService.actions.executeCommand(
      'SetDeflectionCommand',
      sourceId,
      (value as number) / 100,
    );
  }

  function onInputHandler(name: string, value: TObsValue) {
    EditorCommandsService.actions.executeCommand('SetAudioSettingsCommand', sourceId, {
      [name]: value,
    });
  }

  return (
    <div className={styles.audioSettingsRow} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
      <div className={styles.audioSourceName}>{name}</div>
      <i
        className={muted ? 'icon-mute' : 'icon-audio'}
        onClick={() => onInputHandler('muted', !muted)}
      />
      <SliderInput
        style={{ width: '200px', marginBottom: 0 }}
        value={Math.floor(fader.deflection * 100)}
        hasNumberInput
        slimNumberInput
        max={100}
        min={0}
        onInput={onDeflectionInput}
      />
      <i
        className={mixerHidden ? 'icon-hide' : 'icon-view'}
        onClick={() => onInputHandler('mixerHidden', !mixerHidden)}
      />
      {isAdvancedOutput && (
        <div className={styles.audioSettingsTracks}>
          <div className={styles.trackLabel}>{$t('Stream Track')}</div>
          <BoolButtonInput
            label={String(streamTrack + 1)}
            value={!!trackFlags[streamTrack]}
            onChange={onTrackInput(streamTrack)}
            checkboxStyles={{ marginRight: '8px' }}
          />
          <div className={styles.trackLabel}>{$t('Rec. Tracks')}</div>
          {recordingTracks?.map(track => (
            <BoolButtonInput
              label={String(track + 1)}
              key={track}
              value={!!trackFlags[track]}
              onChange={onTrackInput(track)}
              checkboxStyles={{ marginRight: '4px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PanelForm(p: { source: AudioSource }) {
  const { sourceId, forceMono, syncOffset, source, monitoringType } = p.source;

  const hasDevices = source ? !source.video : false;

  const { EditorCommandsService } = Services;

  function onSettingsHandler(name: string, value: TObsValue) {
    EditorCommandsService.actions.executeCommand('SetAudioSettingsCommand', sourceId, {
      [name]: value,
    });
  }

  return (
    <Form>
      {hasDevices && source && <DeviceInputs source={source} />}
      <SliderInput
        label={$t('Sync Offset (ms)')}
        hasNumberInput
        value={syncOffset}
        onInput={value => onSettingsHandler('syncOffset', value)}
      />
      <SwitchInput
        label={$t('Downmix to Mono')}
        value={forceMono}
        onInput={value => onSettingsHandler('forceMono', value)}
      />
      <ListInput
        label={$t('Audio Monitoring')}
        options={p.source.monitoringOptions}
        value={monitoringType}
        onInput={value => onSettingsHandler('monitoringType', value)}
      />
    </Form>
  );
}

function DeviceInputs(p: { source: Source }) {
  const { EditorCommandsService } = Services;

  const sourceProperties = useMemo<TObsFormData>(() => p.source.getPropertiesFormData(), []);
  const settings = useMemo(() => p.source.getSettings(), []);
  const [statefulSettings, setStatefulSettings] = useState(settings);

  const deviceOptions = (sourceProperties[0] as IObsListInput<TObsValue>).options.map(option => ({
    label: option.description,
    value: option.value,
  }));

  function handleInput(name: string, value: TObsValue) {
    setStatefulSettings({ ...statefulSettings, [name]: value });
    EditorCommandsService.actions.executeCommand('EditSourceSettingsCommand', p.source.sourceId, {
      [name]: value,
    });
  }

  return (
    <>
      <ListInput
        label={$t('Device')}
        options={deviceOptions}
        value={statefulSettings.device_id}
        onInput={value => handleInput('device_id', value)}
      />
      <SwitchInput
        label={$t('Use Device Timestamps')}
        value={statefulSettings.use_device_timing}
        onInput={value => handleInput('use_device_timing', value)}
      />
    </>
  );
}
