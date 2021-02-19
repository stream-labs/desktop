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
import { SourceFiltersService } from 'services/source-filters';
import { SourcesService } from 'services/sources';

@Component({})
export default class HardwareSetup extends TsxComponent {
  @Inject() defaultHardwareService: DefaultHardwareService;
  @Inject() sourceFiltersService: SourceFiltersService;
  @Inject() sourcesService: SourcesService;

  mounted() {
    this.defaultHardwareService.createTemporarySources();
  }

  destroyed() {
    this.defaultHardwareService.clearTemporarySources();
  }

  get presetFilterValue() {
    return this.defaultHardwareService.state.presetFilter;
  }

  set presetFilterValue(filter: string) {
    this.defaultHardwareService.setPresetFilter(filter);
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

  get selectedVideoSourceId() {
    return this.defaultHardwareService.findVideoSource(this.selectedVideoDevice).sourceId;
  }

  setVideoDevice(val: string) {
    const oldPresetValue = this.presetFilterValue;
    if (oldPresetValue) {
      this.setPresetFilter('');
    }
    this.defaultHardwareService.setDefault('video', val);
    if (oldPresetValue) {
      this.setPresetFilter(oldPresetValue);
    }
  }

  setPresetFilter(value: string) {
    this.presetFilterValue = value;
    if (value === '') {
      this.sourceFiltersService.remove(this.selectedVideoSourceId, '__PRESET');
    } else {
      this.sourceFiltersService.addPresetFilter(this.selectedVideoSourceId, value);
    }
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
            <div>
              <VFormGroup
                metadata={metadata.list({ options: this.videoDevices })}
                value={this.selectedVideoDevice}
                onInput={(id: string) => this.setVideoDevice(id)}
              />
              <VFormGroup
                metadata={this.sourceFiltersService.views.presetFilterMetadata}
                value={this.presetFilterValue}
                onInput={(value: string) => this.setPresetFilter(value)}
              />
            </div>
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
            metadata={metadata.list({
              options: this.audioDevices,
              openDirection: 'bottom',
              optionsHeight: 120,
            })}
            value={this.selectedAudioDevice}
            onInput={(id: string) => (this.selectedAudioDevice = id)}
          />
        </div>
      </div>
    );
  }
}
