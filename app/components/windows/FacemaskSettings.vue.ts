import Vue from 'vue';
import electron from 'electron';
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
  bitsEnabledModel = this.facemasksService.state.settings.bits_enabled;
  bitsPriceModel = this.facemasksService.state.settings.bits_price;
  durationModel = this.facemasksService.state.settings.duration;
  videoInputModel = this.facemasksService.state.device.value;
  t2AvailableMasks = this.facemasksService.state.settings.t2masks as IFacemaskSelection[];
  t3AvailableMasks = this.facemasksService.state.settings.t3masks as IFacemaskSelection[];

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

  async handleSubmit() {
    this.updatingInfo = true;

    const newSettings = {
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

    const validatedSettings = this.validateSettings(newSettings);

    if (validatedSettings.error) {
      this.onFailHandler(validatedSettings.message);
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

    if (settings.bits_enabled && bitsPrices.indexOf(settings.bits_price) === -1) {
      error = true;
      message = 'Error: Please select a bits price';
    }

    if (!settings.device) {
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
    this.facemasksService.trigger(mask.uuid, this.facemasksService.state.settings.sub_duration);
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

  openTipPage() {
    electron.remote.shell.openExternal(`https://streamlabs.com/${this.username}/masks`);
  }

  openExtensionPage() {
    electron.remote.shell.openExternal(this.extensionUrl);
  }

  get extensionUrl() {
    return this.facemasksService.state.settings.extension_url;
  }

  get showExtensionPromt() {
    return (
      this.facemasksService.state.settings.subs_enabled &&
      !this.facemasksService.state.settings.extension_enabled
    );
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
    return (
      this.facemasksService.state.settings.extension &&
      this.facemasksService.state.settings.partnered
    );
  }
}
