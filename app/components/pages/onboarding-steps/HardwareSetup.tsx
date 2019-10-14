import { Component } from 'vue-property-decorator';
import { OnboardingStep } from 'streamlabs-beaker';
import TsxComponent from 'components/tsx-component';
import { Inject } from 'services/core/injector';
import { AudioService } from 'services/audio';
import { $t } from 'services/i18n';
import { EDeviceType, HardwareService } from 'services/hardware';
import { SourcesService, ISourceAddOptions } from 'services/api/external-api/sources';
import MixerVolmeter from 'components/MixerVolmeter.vue';
import Display from 'components/shared/Display.vue';
import { ERenderingMode } from '../../../../obs-api';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata } from 'components/widgets/inputs';

// import styles from './HardwareSetup.m.less';

@Component({})
export default class ObsImport extends TsxComponent {
  @Inject() audioService: AudioService;
  @Inject() sourcesService: SourcesService;
  @Inject() hardwareService: HardwareService;

  selectedAudioDevice: string = 'default';
  selectedVideoDevice: string = '';

  mounted() {
    this.audioDevices.forEach(device => {
      this.sourcesService.createSource(
        device.value,
        'wasapi_input_capture',
        { device_id: device.value },
        {
          isTemporary: true,
          sourceId: device.value,
        } as ISourceAddOptions,
      );
    });

    this.videoDevices.forEach(device => {
      this.sourcesService.createSource(
        device.value,
        'dshow_input',
        { video_device_id: device.value },
        {
          isTemporary: true,
          sourceId: device.value,
        } as ISourceAddOptions,
      );
    });

    if (this.videoDevices[0]) this.selectedVideoDevice = this.videoDevices[0].value;
  }

  get selectedAudioSource() {
    if (!this.selectedAudioDevice) return;
    return this.audioService.getSource(this.selectedAudioDevice);
  }

  get selectedVideoSource() {
    if (!this.selectedVideoDevice) return;
    return this.sourcesService.getSource(this.selectedVideoDevice);
  }

  get audioDevices() {
    return this.audioService
      .getDevices()
      .filter(device => device.type === EDeviceType.audioInput)
      .map(device => ({
        title: device.description,
        value: device.id,
      }));
  }

  get videoDevices() {
    return this.hardwareService
      .getDshowDevices()
      .filter(device => EDeviceType.videoInput === device.type)
      .map(device => ({
        title: device.description,
        value: device.id,
      }));
  }

  render() {
    return (
      <OnboardingStep slot="2">
        <template slot="title">{$t('Setup Mic and Webcam')}</template>
        <template slot="desc">{$t('Configure your hardware to go live seamlessly')}</template>
        <div style="width: 60%;">
          {this.selectedVideoDevice && (
            <div style="height: 200px;">
              <Display
                sourceId={this.selectedVideoDevice}
                renderingMode={ERenderingMode.OBS_MAIN_RENDERING}
              />
            </div>
          )}
          <VFormGroup
            metadata={metadata.list({
              options: this.videoDevices,
              title: $t('Select your webcam'),
            })}
            value={this.selectedVideoDevice}
            onInput={(id: string) => (this.selectedVideoDevice = id)}
          />
          {this.selectedAudioSource && <MixerVolmeter audioSource={this.selectedAudioSource} />}
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
