import { Component } from 'vue-property-decorator';
import { OnboardingStep } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { DefaultHardwareService } from 'services/hardware';
import MixerVolmeter from 'components/MixerVolmeter.vue';
import Display from 'components/shared/Display.vue';
import { ERenderingMode } from '../../../../obs-api';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata } from 'components/widgets/inputs';

@Component({})
export default class HardwareSetup extends TsxComponent {
  @Inject() defaultHardwareService: DefaultHardwareService;

  mounted() {
    this.defaultHardwareService.createTemporarySources();
    if (this.videoDevices[0]) this.selectedVideoDevice = this.videoDevices[0].value;
  }

  destroyed() {
    this.defaultHardwareService.clearTemporarySources();
  }

  get audioDevices() {
    return this.defaultHardwareService.audioDevices.map(device => ({
      title: device.description,
      value: device.id,
    }));
  }

  get videoDevices() {
    return this.defaultHardwareService.videoDevices.map(device => ({
      title: device.description,
      value: device.id,
    }));
  }

  get selectedAudioDevice() {
    return this.defaultHardwareService.state.defaultAudioDevice;
  }

  set selectedAudioDevice(val: string) {
    this.defaultHardwareService.setDefault('audio', val);
  }

  get selectedVideoDevice() {
    return this.defaultHardwareService.state.defaultVideoDevice;
  }

  set selectedVideoDevice(val: string) {
    this.defaultHardwareService.setDefault('video', val);
  }

  get displayRender() {
    return (
      this.selectedVideoDevice &&
      !!this.videoDevices.length && (
        <div style="height: 200px; margin-bottom: 8px;">
          <Display
            sourceId={this.selectedVideoDevice}
            renderingMode={ERenderingMode.OBS_MAIN_RENDERING}
          />
        </div>
      )
    );
  }

  render() {
    return (
      <OnboardingStep slot="2">
        <template slot="title">{$t('Setup Mic and Webcam')}</template>
        <div style="width: 60%;">
          {this.displayRender}
          {!!this.videoDevices.length && (
            <VFormGroup
              metadata={metadata.list({
                options: this.videoDevices,
                title: $t('Select your webcam'),
              })}
              value={this.selectedVideoDevice}
              onInput={(id: string) => (this.selectedVideoDevice = id)}
            />
          )}
          {this.defaultHardwareService.selectedAudioSource && (
            <MixerVolmeter audioSource={this.defaultHardwareService.selectedAudioSource} />
          )}
          <VFormGroup
            metadata={metadata.list({ options: this.audioDevices, title: $t('Select your mic') })}
            value={this.selectedAudioDevice}
            onInput={(id: string) => (this.selectedAudioDevice = id)}
          />
        </div>
      </OnboardingStep>
    );
  }
}
