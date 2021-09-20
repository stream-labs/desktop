import React from 'react';
import { AudioSource } from '../../services/audio';
import { propertyComponentForType } from 'components/obs/inputs/Components';
import { TObsValue } from 'components/obs/inputs/ObsInput';
import { ModalLayout } from '../shared/ModalLayout';
import { Services } from '../service-provider';
import { $t } from '../../services/i18n';
import styles from './AdvancedAudio.m.less';
import { useVuex } from '../hooks';

export default function AdvancedAudio() {
  const { AudioService, WindowsService, EditorCommandsService } = Services;

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
      <form slot="content">
        <table>
          {audioSources.map(audioSource => (
            <tr key={audioSource.name} className={styles.audioSettingsRow}>
              <td className={styles.nameCell}>
                <div className={styles.audioSourceName}>{audioSource.name}</div>
              </td>
              {audioSource.getSettingsForm().map(formInput => {
                if (!formInput.type) return;
                const Component = propertyComponentForType(formInput.type) as any;
                return (
                  <td
                    key={`${audioSource.name}${formInput.name}`}
                    className={styles['column-' + formInput.name]}
                  >
                    <div className={styles.advancedAudioInput}>
                      <Component
                        value={formInput}
                        onInput={(value: { value: TObsValue }) =>
                          onInputHandler(audioSource, formInput.name, value.value)
                        }
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </table>
      </form>
    </ModalLayout>
  );
}
