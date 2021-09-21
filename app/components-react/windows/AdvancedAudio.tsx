import React, { useState } from 'react';
import { Collapse } from 'antd';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { SliderInput, BoolButtonInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import { TObsValue } from 'components/obs/inputs/ObsInput';
import { Services } from 'components-react/service-provider';
import { AudioSource } from 'services/audio';
import { $t } from 'services/i18n';
import styles from './AdvancedAudio.m.less';
import { useVuex } from 'components-react/hooks';

const { Panel } = Collapse;

export default function AdvancedAudio() {
  const { AudioService, EditorCommandsService } = Services;

  const [expandedSource, setExpandedSource] = useState('');

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
        accordion
        activeKey={expandedSource}
        onChange={(key: string) => setExpandedSource(key)}
        bordered={false}
        expandIcon={({ isActive }) => <i className={isActive ? 'icon-subtract' : 'icon-add'} />}
      >
        {audioSources.map(audioSource => (
          <Panel key={audioSource.name} header={<PanelHeader source={audioSource} />}>
            <Form></Form>
          </Panel>
        ))}
      </Collapse>
    </ModalLayout>
  );
}

function PanelHeader(p: { source: AudioSource }) {
  const { name, mixerHidden, muted, fader } = p.source;
  return (
    <div className={styles.audioSettingsRow}>
      <div className={styles.audioSourceName}>{name}</div>
      <i className={muted ? 'icon-mute' : 'icon-audio'} />
      <SliderInput value={fader.deflection} hasNumberInput />
      <i className={mixerHidden ? 'icon-hide' : 'icon-view'} />
      <div>
        {$t('Stream Track')}
        <BoolButtonInput label="1" />
      </div>
      <div>{$t('Rec. Tracks')}</div>
    </div>
  );
}
