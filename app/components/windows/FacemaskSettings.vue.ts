import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import ModalLayout from '../ModalLayout.vue';
import { BoolInput, ListInput, ToggleInput, SliderInput } from 'components/shared/inputs/inputs';
import { ProgressBar } from 'streamlabs-beaker';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { FacemasksService } from 'services/facemasks';

interface IInputDeviceSelection {
  name: string;
  value: string;
  selected?: boolean;
}

@Component({
  components: {
    ModalLayout,
    HFormGroup,
    BoolInput,
    ListInput,
    ProgressBar,
    ToggleInput,
    SliderInput,
  },
})
export default class FacemaskSettings extends Vue {
  @Inject() facemasksService: FacemasksService;
  updatingInfo = false;
  enabledModel = this.facemasksService.state.settings.enabled;
  durationModel = this.facemasksService.state.settings.duration;
  videoInputModel = this.facemasksService.state.device.value;
  inputDevices = this.facemasksService.getInputDevicesList().map(device => {
    return {
      title: device.name,
      value: device.value,
    };
  });

  async handleSubmit() {
    this.updatingInfo = true;
    const newSettings = {
      enabled: this.enabledModel,
      duration: this.durationModel,
      device: this.facemasksService.getInputDevicesList().filter(device => {
        return device.value === this.videoInputModel;
      })[0],
    };
    try {
      await this.facemasksService.updateFacemaskSettings(newSettings);
      this.updatingInfo = false;
    } catch (e) {
      console.log(e);
    }
  }

  cancel() {
    return;
  }

  onVideoInputSelect(webcam: IInputDeviceSelection) {
    console.log(webcam);
  }

  get videoInputMetadata() {
    return {
      internalSearch: false,
      allowEmpty: true,
      options: this.inputDevices,
    };
  }

  get facemasksEnabled() {
    return this.facemasksService.state.settings.enabled;
  }

  get downloadProgress() {
    return this.facemasksService.state.downloadProgress * 100;
  }
}
