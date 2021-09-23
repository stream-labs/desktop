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
import { TObsValue } from 'components/obs/inputs/ObsInput';
import { Services } from 'components-react/service-provider';
import { AudioSource } from 'services/audio';
import { $t } from 'services/i18n';
import styles from './AdvancedAudio.m.less';
import { useVuex } from 'components-react/hooks';

const { Panel } = Collapse;

export default function AdvancedAudio() {
  const { AudioService, EditorCommandsService, WindowsService } = Services;
  const initialSource = WindowsService.getChildWindowQueryParams().sourceId || '';

  const [expandedSource, setExpandedSource] = useState(initialSource);

  const { audioSources } = useVuex(() => ({
    audioSources: AudioService.views.sourcesForCurrentScene,
  }));

  function onInputHandler(sourceId: string, name: string, value: TObsValue) {
    EditorCommandsService.executeCommand('SetAudioSettingsCommand', sourceId, {
      [name]: value,
    });
  }

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
            <Form>
              <ListInput label={$t('Device')} options={[]} />
              <SwitchInput label={$t('Use Device Timestamps')} />
              <SliderInput label={$t('Sync Offset')} hasNumberInput />
              <SwitchInput label={$t('Downmix to Mono')} />
              <ListInput label={$t('Monitoring')} options={[]} />
            </Form>
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

  function onInputHandler(name: string) {
    return (value: TObsValue) => {
      if (name === 'deflection') {
        EditorCommandsService.executeCommand(
          'SetDeflectionCommand',
          sourceId,
          (value as number) / 100,
        );
      } else {
        EditorCommandsService.executeCommand('SetAudioSettingsCommand', sourceId, {
          [name]: value,
        });
      }
    };
  }

  return (
    <div className={styles.audioSettingsRow} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
      <div className={styles.audioSourceName}>{name}</div>
      <i
        className={muted ? 'icon-mute' : 'icon-audio'}
        onClick={() => onInputHandler('muted')(!muted)}
      />
      <SliderInput
        style={{ width: '200px', marginBottom: 0 }}
        value={fader.deflection * 100}
        hasNumberInput
        onInput={onInputHandler('deflection')}
      />
      <i
        className={mixerHidden ? 'icon-hide' : 'icon-view'}
        onClick={() => onInputHandler('mixerHidden')(!mixerHidden)}
      />
      {isAdvancedOutput && (
        <div className={styles.audioSettingsTracks}>
          <div className={styles.trackLabel}>{$t('Stream Track')}</div>
          <BoolButtonInput label={streamTrack} />
          <div className={styles.trackLabel}>{$t('Rec. Tracks')}</div>
          {recordingTracks?.map(track => (
            <BoolButtonInput label={track} key={track} />
          ))}
        </div>
      )}
    </div>
  );
}
