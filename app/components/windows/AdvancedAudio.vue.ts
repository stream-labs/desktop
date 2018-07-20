import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { WindowsService } from '../../services/windows';
import { IAudioServiceApi, IAudioSourceApi } from '../../services/audio';
import { propertyComponentForType } from '../shared/forms/Components';
import windowMixin from '../mixins/window';

import ModalLayout from '../ModalLayout.vue';
import { TObsValue } from '../shared/forms/ObsInput';

@Component({
  components: { ModalLayout },
  mixins: [windowMixin]
})
export default class AdvancedAudio extends Vue {

  @Inject() audioService: IAudioServiceApi;
  @Inject() windowsService: WindowsService;

  propertyComponentForType = propertyComponentForType;


  get audioSources() {
    return this.audioService.getSourcesForCurrentScene();
  }

  onInputHandler(audioSource: IAudioSourceApi, name: string, value: TObsValue) {
    audioSource.setSettings({ [name]: value });
  }

}
