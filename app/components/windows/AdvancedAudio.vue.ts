import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/core/injector';
import { WindowsService } from '../../services/windows';
import { AudioService, AudioSource } from '../../services/audio';
import { propertyComponentForType } from 'components/obs/inputs/Components';
import ModalLayout from '../ModalLayout.vue';
import { TObsValue } from 'components/obs/inputs/ObsInput';
import { EditorCommandsService } from 'services/editor-commands';

@Component({
  components: { ModalLayout },
})
export default class AdvancedAudio extends Vue {
  @Inject() audioService: AudioService;
  @Inject() windowsService: WindowsService;
  @Inject() editorCommandsService: EditorCommandsService;

  propertyComponentForType = propertyComponentForType;

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
}
