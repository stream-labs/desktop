import React, { useState } from 'react';
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
import { $t } from 'services/i18n';
import Utils from 'services/utils';
import styles from './AdvancedAudio.m.less';

const { Panel } = Collapse;

export default function AdvancedAudio() {
  const { AudioService, WindowsService } = Services;
  const initialSource = WindowsService.getChildWindowQueryParams().sourceId || '';

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
  const { name, mixerHidden, muted, fader, sourceId } = p.source;
  const { EditorCommandsService, SettingsService } = Services;
  const { isAdvancedOutput, recordingTracks, streamTrack } = useVuex(() => ({
    isAdvancedOutput: SettingsService.views.isAdvancedOutput,
    streamTrack: SettingsService.views.streamTrack,
    recordingTracks: SettingsService.views.recordingTracks,
  }));

  const trackValue = p.source.getSettingsForm()[5].value as number;
  const [trackFlags, setTrackFlags] = useState(Utils.numberToBinnaryArray(trackValue, 6));

  function onTrackInput(index: number | undefined) {
    return (value: boolean) => {
      const bitwise = value ? 1 : 0;
      setTrackFlags(trackFlags.map((el, i) => (i === index ? bitwise : el)));
      const newValue = Utils.binnaryArrayToNumber(trackFlags.reverse());
      EditorCommandsService.executeCommand('SetAudioSettingsCommand', sourceId, {
        audioMixers: newValue,
      });
    };
  }

  function onDeflectionInput(value: number) {
    EditorCommandsService.executeCommand('SetDeflectionCommand', sourceId, (value as number) / 100);
  }

  function onInputHandler(name: string, value: TObsValue) {
    EditorCommandsService.executeCommand('SetAudioSettingsCommand', sourceId, {
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
  const { sourceId, forceMono, syncOffset } = p.source;
  const sourceProperties = p.source.source?.getPropertiesFormData();

  const hasDevices = !p.source.source?.video;

  const { EditorCommandsService } = Services;

  function onSettingsHandler(name: string, value: TObsValue) {
    EditorCommandsService.executeCommand('SetAudioSettingsCommand', sourceId, {
      [name]: value,
    });
  }

  return (
    <Form>
      {hasDevices && sourceProperties && <DeviceInputs sourceProperties={sourceProperties} />}
      <SliderInput
        label={$t('Sync Offset')}
        hasNumberInput
        value={syncOffset}
        onInput={value => onSettingsHandler('syncOffset', value)}
      />
      <SwitchInput
        label={$t('Downmix to Mono')}
        value={forceMono}
        onInput={value => onSettingsHandler('forceMono', value)}
      />
      <ListInput label={$t('Monitoring')} options={[]} />
    </Form>
  );
}

function DeviceInputs(p: { sourceProperties: TObsFormData }) {
  const deviceInput = p.sourceProperties[0] as IObsListInput<TObsValue>;
  const timestampsInput = p.sourceProperties[1];
  const deviceOptions = deviceInput.options.map(option => ({
    label: option.description,
    value: option.value,
  }));

  return (
    <>
      <ListInput label={$t('Device')} options={deviceOptions} value={deviceInput.value} />
      <SwitchInput label={$t('Use Device Timestamps')} value={timestampsInput.value as boolean} />
    </>
  );
}
