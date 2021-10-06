import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Button, Collapse } from 'antd';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import {
  SliderInput,
  BoolButtonInput,
  ListInput,
  SwitchInput,
  NumberInput,
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

  const [trackFlags, setTrackFlags] = useState(
    Utils.numberToBinnaryArray(audioMixers, 6).reverse(),
  );

  function onTrackInput(index: number, value: boolean) {
    const newArray = [...trackFlags];
    newArray[index] = Number(value);
    setTrackFlags(newArray);
    const newValue = Utils.binnaryArrayToNumber([...newArray].reverse());
    EditorCommandsService.actions.executeCommand('SetAudioSettingsCommand', sourceId, {
      audioMixers: newValue,
    });
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
    <Form
      className={styles.audioSettingsRow}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      data-role="form"
      data-name="advanced-audio-header"
    >
      <div className={styles.audioSourceName}>{name}</div>
      <i
        className={muted ? 'icon-mute' : 'icon-audio'}
        onClick={() => onInputHandler('muted', !muted)}
      />
      <div style={{ width: '200px' }}>
        <SliderInput
          value={Math.floor(fader.deflection * 100)}
          max={100}
          min={0}
          name="deflection"
          onInput={onDeflectionInput}
          hasNumberInput
          slimNumberInput
          nowrap
        />
      </div>
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
            onChange={value => onTrackInput(streamTrack, value)}
            checkboxStyles={{ marginRight: '8px' }}
            name="streamTrack"
          />
          <div className={styles.trackLabel}>{$t('Rec. Tracks')}</div>
          {recordingTracks?.map(track => (
            <BoolButtonInput
              label={String(track + 1)}
              key={track}
              value={!!trackFlags[track]}
              onChange={value => onTrackInput(track, value)}
              checkboxStyles={{ marginRight: '4px' }}
              name={`flag${track}`}
            />
          ))}
        </div>
      )}
    </Form>
  );
}

function PanelForm(p: { source: AudioSource }) {
  const { sourceId, forceMono, syncOffset, source, monitoringType } = p.source;

  const hasDevices = source ? !source.video : false;
  const isMic = source
    ? [
        'wasapi_input_capture',
        'coreaudio_input_capture',
        'dshow_input',
        'av_capture_input',
      ].includes(source.type)
    : false;

  const { EditorCommandsService } = Services;

  function handleSettingsChange(name: string, value: TObsValue) {
    EditorCommandsService.actions.executeCommand('SetAudioSettingsCommand', sourceId, {
      [name]: value,
    });
  }

  return (
    <Form data-role="form" data-name="advanced-audio-detail">
      {hasDevices && source && <DeviceInputs source={source} />}
      <NumberInput
        label={$t('Sync Offset')}
        value={syncOffset}
        name="syncOffset"
        onInput={value => handleSettingsChange('syncOffset', value)}
        tooltip={$t('Time it takes between sound occuring and being broadcast (ms)')}
      />
      <SwitchInput
        label={$t('Downmix to Mono')}
        value={forceMono}
        name="forceMono"
        onInput={value => handleSettingsChange('forceMono', value)}
        tooltip={$t('Route audio to the central channel instead of left or right stereo channels')}
      />
      <ListInput
        label={$t('Audio Monitoring')}
        options={p.source.monitoringOptions}
        value={monitoringType}
        name="monitoringType"
        onInput={value => handleSettingsChange('monitoringType', value)}
        tooltip={$t(
          'Generally, enabling monitoring sends the audio through the Desktop Audio channel',
        )}
      />
      {isMic && <AudioTestButton source={p.source} handleSettingsChange={handleSettingsChange} />}
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

function AudioTestButton(p: {
  source: AudioSource;
  handleSettingsChange: (name: string, value: number) => void;
}) {
  const [savedMonitoring, setSavedMonitoring] = useState(p.source.monitoringType);
  const [testing, setTesting] = useState(false);
  const [ignoreMonitoringUpdate, setIgnoreMonitoringUpdate] = useState(false);

  useEffect(() => {
    if (!ignoreMonitoringUpdate) {
      setSavedMonitoring(p.source.monitoringType);
    }
    // Ensure monitoring type is returned to normal upon destroy
    return () => {
      p.handleSettingsChange('monitoringType', savedMonitoring);
    };
  }, [p.source.monitoringType, ignoreMonitoringUpdate]);

  function handleButtonClick() {
    if (!testing) {
      setIgnoreMonitoringUpdate(true);
      p.handleSettingsChange('monitoringType', 1);
      setIgnoreMonitoringUpdate(false);
      setTesting(true);
    } else {
      p.handleSettingsChange('monitoringType', savedMonitoring);
      setTesting(false);
    }
  }

  return (
    <div>
      <Button onClick={handleButtonClick}>{$t('Test Audio')}</Button>
    </div>
  );
}
