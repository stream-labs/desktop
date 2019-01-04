import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { WindowsService } from '../../services/windows';
import { IAudioServiceApi, IAudioSourceApi } from '../../services/audio';
import { propertyComponentForType } from 'components/obs/inputs/Components';
import ModalLayout from '../ModalLayout.vue';
import { TObsValue } from 'components/obs/inputs/ObsInput';

@Component({
  components: { ModalLayout },
})
export default class AdvancedAudio extends Vue {
  @Inject() audioService: IAudioServiceApi;
  @Inject() windowsService: WindowsService;

  propertyComponentForType = propertyComponentForType;

  get audioSources() {
    return this.audioService.getSourcesForCurrentScene();
  }

  onInputHandler(audioSource: IAudioSourceApi, name: string, value: TObsValue) {
    if (name === 'deflection') {
      audioSource.setDeflection((value as number) / 100);
    } else {
      audioSource.setSettings({ [name]: value });
    }
  }
}
