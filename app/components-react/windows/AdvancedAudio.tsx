import React from 'react';
import { Collapse } from 'antd';
import { ModalLayout } from '../shared/ModalLayout';
import { SliderInput } from '../shared/inputs';
import { TObsValue } from '../../components/obs/inputs/ObsInput';
import { Services } from '../service-provider';
import { AudioSource } from '../../services/audio';
import { $t } from '../../services/i18n';
import styles from './AdvancedAudio.m.less';
import { useVuex } from '../hooks';

const { Panel } = Collapse;

export default function AdvancedAudio() {
  const { AudioService, EditorCommandsService } = Services;

  const { audioSources } = useVuex(() => ({
    audioSources: AudioService.views.sourcesForCurrentScene,
  }));

  function onInputHandler(audioSource: AudioSource, name: string, value: TObsValue) {
    if (name === 'deflection') {
      EditorCommandsService.executeCommand(
        'SetDeflectionCommand',
        audioSource.sourceId,
        (value as number) / 100,
      );
    } else {
      EditorCommandsService.executeCommand('SetAudioSettingsCommand', audioSource.sourceId, {
        [name]: value,
      });
    }
  }

  return (
    <ModalLayout hideFooter>
      <Collapse
        bordered={false}
        expandIcon={({ isActive }) => <i className={isActive ? 'icon-subtract' : 'icon-add'} />}
      >
        {audioSources.map(audioSource => (
          <Panel key={audioSource.name} header={<PanelHeader source={audioSource} />}></Panel>
        ))}
      </Collapse>
    </ModalLayout>
  );
}

function PanelHeader(p: { source: AudioSource }) {
  return (
    <div className={styles.audioSettingsRow}>
      <div className={styles.audioSourceName}>{p.source.name}</div>
      <i className={p.source.muted ? 'icon-mute' : 'icon-audio'} />
      <SliderInput />
      <i className={p.source.mixerHidden ? 'icon-hide' : 'icon-view'} />
      <div>{$t('Stream Tracks')}</div>
      <div>{$t('Red Tracks')}</div>
    </div>
  );
}
