import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from 'components/ModalLayout.vue';
import { ListInput, ToggleInput, SliderInput, NumberInput } from 'components/shared/inputs/inputs';
import { ProgressBar, ItemGrid, VirtualItem, Accordion } from 'streamlabs-beaker';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { FacemasksService } from 'services/facemasks/index';

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
}

interface IFormSettings {
  enabled: boolean;
  donations_enabled: boolean;
  subs_enabled: boolean;
  bits_enabled: boolean;
  bits_price: number;
  duration: number;
  device: {
    name: string;
    value: string;
  };
}

@Component({
  components: {
    ModalLayout,
    HFormGroup,
    NumberInput,
    ListInput,
    ProgressBar,
    ItemGrid,
    VirtualItem,
    ToggleInput,
    SliderInput,
    Accordion,
  },
})
export default class FacemaskSettings extends Vue {
  @Inject() facemasksService: FacemasksService;
  updatingInfo = false;
  enabledModel = this.facemasksService.state.settings.enabled;
  donationsEnabledModel = this.facemasksService.state.settings.donations_enabled;
  subsEnabledModel = this.facemasksService.state.settings.subs_enabled;
  bitsEnabledModel = this.facemasksService.state.settings.bits_enabled;
  bitsPriceModel = this.facemasksService.state.settings.bits_price;
  durationModel = this.facemasksService.state.settings.duration;
  videoInputModel = this.facemasksService.state.settings.device.value;
  availableMasks = this.facemasksService.state.settings.facemasks as IFacemaskSelection[];

  inputDevices = this.facemasksService.getInputDevicesList().map(device => {
    return {
      title: device.name,
      value: device.value,
    };
  });

  pricingOptions = this.facemasksService.state.settings.pricing_options.map(option => {
    return {
      title: option,
      value: option,
    };
  });

  createSettingsObject(): IFormSettings {
    return {
      enabled: this.enabledModel,
      donations_enabled: this.donationsEnabledModel,
      subs_enabled: this.subsEnabledModel,
      bits_enabled: this.bitsEnabledModel,
      bits_price: this.bitsPriceModel,
      duration: this.durationModel,
      device: this.facemasksService.getInputDevicesList().filter(device => {
        return device.value === this.videoInputModel;
      })[0],
    };
  }

  async handleSubmit() {
    this.updatingInfo = true;

    const newSettings = this.createSettingsObject();

    if (!newSettings.device) {
      newSettings.device = {
        name: null,
        value: null,
      };
    }

    const validationResults = this.validateSettings(newSettings);

    if (validationResults.error) {
      this.onFailHandler(validationResults.message);
      this.updatingInfo = false;
      return;
    }

    try {
      await this.facemasksService.updateFacemaskSettings(newSettings);
      this.updatingInfo = false;
      this.onSuccessHandler('Settings Updated');
    } catch (e) {
      this.onFailHandler('Request Failed');
      this.updatingInfo = false;
    }
  }

  validateSettings(settings: IFormSettings) {
    let error = false;
    let message = '';
    const bitsPrices = this.facemasksService.state.settings.pricing_options;

    if (!settings.enabled) {
      return {
        error,
        message,
      };
    }

    if (!settings.device.value) {
      error = true;
      message = 'Error: Please select a video device';
    }

    return {
      error,
      message,
    };
  }

  cancel() {
    this.facemasksService.closeSettings();
  }

  clickMask(mask: IFacemaskSelection) {
    this.facemasksService.playMask(mask.uuid);
  }

  onFailHandler(msg: string) {
    this.$toasted.show(msg, {
      position: 'bottom-center',
      className: 'toast-alert',
      duration: 3000,
      singleton: true,
    });
  }

  onSuccessHandler(msg: string) {
    this.$toasted.show(msg, {
      position: 'bottom-center',
      className: 'toast-success',
      duration: 3000,
      singleton: true,
    });
  }

  get videoInputMetadata() {
    return {
      internalSearch: false,
      allowEmpty: true,
      options: this.inputDevices,
    };
  }

  get bitsPricingMetadata() {
    return {
      internalSearch: false,
      allowEmpty: true,
      options: this.pricingOptions,
    };
  }

  get facemasksEnabled() {
    return this.facemasksService.state.settings.enabled;
  }

  get username() {
    return this.facemasksService.state.settings.username;
  }

  get downloadProgress() {
    return this.facemasksService.state.downloadProgress * 100;
  }

  get videoDeviceReady() {
    return this.facemasksService.getDeviceStatus();
  }

  get showTwitchFeatures() {
    return this.facemasksService.state.settings.partnered;
  }
}
