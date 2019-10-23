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

const styles = {
  volmeter: {
    position: 'relative',
    background: 'var(--section)',
    height: '16px',
    borderRadius: '4px',
  },
  center: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(0, -14%)',
    width: '100%',
  },
};

@Component({})
export default class HardwareSetup extends TsxComponent {
  @Inject() defaultHardwareService: DefaultHardwareService;

  mounted() {
    this.defaultHardwareService.createTemporarySources();
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

  setVideoDevice(val: string) {
    try {
      this.defaultHardwareService.setDefault('video', val);
    } catch {
      this.$toasted.show($t('This device is not available'), {
        position: 'bottom-center',
        className: 'toast-alert',
        duration: 3000,
        singleton: true,
      });
    }
  }

  get displayRender() {
    return (
      this.selectedVideoDevice &&
      !!this.videoDevices.length && (
        <div style="height: 200px; margin-bottom: 8px;">
          <Display
            sourceId={this.defaultHardwareService.selectedVideoSource.sourceId}
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
              onInput={(id: string) => this.setVideoDevice(id)}
            />
          )}
          {this.defaultHardwareService.selectedAudioSource && (
            <div style={styles.volmeter}>
              <MixerVolmeter
                audioSource={this.defaultHardwareService.selectedAudioSource}
                style={styles.center}
              />
            </div>
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
