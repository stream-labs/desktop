import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { DefaultHardwareService } from 'services/hardware';
import MixerVolmeter from 'components/MixerVolmeter.vue';
import Display from 'components/shared/Display.vue';
import { ERenderingMode } from '../../../../obs-api';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { metadata } from 'components/widgets/inputs';
import commonStyles from './Common.m.less';
import styles from './HardwareSetup.m.less';

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
    this.defaultHardwareService.setDefault('video', val);
  }

  get displayRender() {
    return this.defaultHardwareService.selectedVideoSource && !!this.videoDevices.length ? (
      <div class={styles.display}>
        <Display
          sourceId={this.defaultHardwareService.selectedVideoSource.sourceId}
          renderingMode={ERenderingMode.OBS_MAIN_RENDERING}
          key={this.defaultHardwareService.selectedVideoSource.sourceId}
        />
      </div>
    ) : (
      <div class={styles.placeholder}>
        <span>{$t('No webcam detected')}</span>
      </div>
    );
  }

  render() {
    return (
      <div style="width: 100%;">
        <h1 class={commonStyles.titleContainer}>{$t('Set Up Mic and Webcam')}</h1>
        <div class={styles.contentContainer}>
          {this.displayRender}
          {!!this.videoDevices.length && (
            <VFormGroup
              metadata={metadata.list({ options: this.videoDevices })}
              value={this.selectedVideoDevice}
              onInput={(id: string) => this.setVideoDevice(id)}
            />
          )}
          {this.defaultHardwareService.selectedAudioSource && (
            <div
              class={styles.volmeter}
              key={this.defaultHardwareService.selectedAudioSource.sourceId}
            >
              <MixerVolmeter
                audioSource={this.defaultHardwareService.selectedAudioSource}
                volmetersEnabled={true}
                class={styles.volmeterCenter}
              />
            </div>
          )}
          <VFormGroup
            metadata={metadata.list({ options: this.audioDevices })}
            value={this.selectedAudioDevice}
            onInput={(id: string) => (this.selectedAudioDevice = id)}
          />
        </div>
      </div>
    );
  }
}
