import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/core/injector';
import { WindowsService } from '../../services/windows';
import { AudioService, AudioSource } from '../../services/audio';
import { propertyComponentForType } from 'components/obs/inputs/Components';
import ModalLayout from '../ModalLayout.vue';
import { TObsValue } from 'components/obs/inputs/ObsInput';
import { EditorCommandsService } from 'services/editor-commands';
import { $t } from 'services/i18n';
import styles from './AdvancedAudio.m.less';

@Component({
  components: { ModalLayout },
})
export default class AdvancedAudio extends Vue {
  @Inject() audioService: AudioService;
  @Inject() windowsService: WindowsService;
  @Inject() editorCommandsService: EditorCommandsService;

  get audioSources() {
    return this.audioService.views.sourcesForCurrentScene;
  }

  onInputHandler(audioSource: AudioSource, name: string, value: TObsValue) {
    if (name === 'deflection') {
      this.editorCommandsService.executeCommand(
        'SetDeflectionCommand',
        audioSource.sourceId,
        (value as number) / 100,
      );
    } else {
      this.editorCommandsService.executeCommand('SetAudioSettingsCommand', audioSource.sourceId, {
        [name]: value,
      });
    }
  }

  get tableHeaders() {
    return (
      <thead>
        <tr>
          <th class={styles.audioSourceName}>{$t('Name')}</th>
          <th>{$t('Volume ( % )')}</th>
          <th>{$t('Hide in Mixer')}</th>
          <th>{$t('Downmix to Mono')}</th>
          <th>{$t('Sync Offset ( ms )')}</th>
          <th>{$t('Audio Monitoring')}</th>
          <th>{$t('Tracks')}</th>
        </tr>
      </thead>
    );
  }

  render() {
    return (
      <ModalLayout showControls={false}>
        <form slot="content">
          <table>
            {this.tableHeaders}

            {this.audioSources.map(audioSource => (
              <tr key={audioSource.name} name={audioSource.name} class={styles.audioSettingsRow}>
                <td class={styles.nameCell}>
                  <div class={styles.audioSourceName}>{audioSource.name}</div>
                </td>
                {audioSource.getSettingsForm().map(formInput => {
                  const Component = propertyComponentForType(formInput.type);
                  return (
                    <td
                      key={`${audioSource.name}${formInput.name}`}
                      class={styles['column-' + formInput.name]}
                    >
                      <div class={styles.advancedAudioInput}>
                        <Component
                          value={formInput}
                          onInput={(value: { value: TObsValue }) =>
                            this.onInputHandler(audioSource, formInput.name, value.value)
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
}
