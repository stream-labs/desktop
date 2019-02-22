import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import ModalLayout from '../ModalLayout.vue';
import { BoolInput, ListInput, ToggleInput, SliderInput } from 'components/shared/inputs/inputs';
import { ProgressBar, ItemGrid, VirtualItem } from 'streamlabs-beaker';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { FacemasksService } from 'services/facemasks';

interface IInputDeviceSelection {
  name: string;
  value: string;
  selected?: boolean;
}

interface IFacemaskSelection {
  uuid: string;
  type: string;
  tier: number;
  name: string;
  selectionCount: number;
  selected: boolean;
}

@Component({
  components: {
    ModalLayout,
    HFormGroup,
    BoolInput,
    ListInput,
    ProgressBar,
    ItemGrid,
    VirtualItem,
    ToggleInput,
    SliderInput,
  },
})
export default class FacemaskSettings extends Vue {
  @Inject() facemasksService: FacemasksService;
  updatingInfo = false;
  enabledModel = this.facemasksService.state.settings.enabled;
  donationsEnabledModel = this.facemasksService.state.settings.donations_enabled;
  subsEnabledModel = this.facemasksService.state.settings.subs_enabled;
  durationModel = this.facemasksService.state.settings.duration;
  videoInputModel = this.facemasksService.state.device.value;
  userT2masks = this.facemasksService.state.settings.userT2masks;
  userT3masks = this.facemasksService.state.settings.userT3masks;

  t2AvailableMasks = this.facemasksService.state.settings.t2masks.map(mask => {
    return {
      uuid: mask.uuid,
      type: mask.type,
      tier: mask.tier,
      name: mask.name,
      selected: this.userT2masks.indexOf(mask.uuid) !== -1 ? true : false,
    } as IFacemaskSelection;
  });

  t3AvailableMasks = this.facemasksService.state.settings.t3masks.map(mask => {
    return {
      uuid: mask.uuid,
      type: mask.type,
      tier: mask.tier,
      name: mask.name,
      selected: this.userT3masks.indexOf(mask.uuid) !== -1 ? true : false,
    } as IFacemaskSelection;
  });

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
      donations_enabled: this.donationsEnabledModel,
      subs_enabled: this.subsEnabledModel,
      duration: this.durationModel,
      userT2masks: this.formatMaskSelections(this.t2AvailableMasks),
      userT3masks: this.formatMaskSelections(this.t3AvailableMasks),
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

  formatMaskSelections(masks: IFacemaskSelection[]) {
    return masks
      .filter(mask => {
        return mask.selected;
      })
      .map(mask => {
        return {
          uuid: mask.uuid,
          tier: mask.tier,
        };
      });
  }

  cancel() {
    return;
  }

  clickMask(mask: IFacemaskSelection, options: IFacemaskSelection[]) {
    if (mask.selected) {
      mask.selected = false;
    } else if (!mask.selected) {
      if (this.validateSelectedMaskCount(options)) {
        mask.selected = true;
      }
    }
  }

  validateSelectedMaskCount(masks: IFacemaskSelection[]) {
    const length = masks.filter(mask => {
      return mask.selected;
    }).length;
    return length < 3;
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
