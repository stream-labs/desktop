import React from 'react';
import { useModule } from 'slap';
import { Services } from '../../service-provider';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import styles from './Common.m.less';
import { $t } from 'services/i18n';
import * as obs from '../../../../obs-api';
import { getOS, OS } from 'util/operating-systems';

class AdvancedSettingsModule {
  service = Services.AdvancedSettingsService;
  outputsService = Services.OutputsService;
  audioService = Services.AudioSettingsService;
  videoService = Services.VideoSettingsService;

  get generalValues() {
    return this.service.generalSettingsValues;
  }

  get sourcesValues() {
    return this.service.sourcesSettingsValues;
  }

  get mediaValues() {
    return this.service.mediaSettingsValues;
  }

  advancedValues(category: string) {
    return this.service.views.advancedSettingsValues(category);
  }

  get otherServiceValues() {
    return {
      video: this.videoService.advancedSettingsValues,
      audio: this.audioService.advancedSettingsValues,
      recording: this.outputsService.recordingSettingsValues,
      replay: this.outputsService.replaySettingsValues,
    };
  }

  get generalMetadata() {
    return {
      processPriority: {
        type: 'list',
        label: $t('Process Priority'),
        options: [
          { label: $t('High'), value: obs.EProcessPriority.High },
          { label: $t('Above Normal'), value: obs.EProcessPriority.AboveNormal },
          { label: $t('Normal'), value: obs.EProcessPriority.Normal },
          { label: $t('Below Normal'), value: obs.EProcessPriority.BelowNormal },
          { label: $t('Idle'), value: obs.EProcessPriority.Idle },
        ],
      },
    };
  }

  get sourcesMetadata() {
    return {
      browserAccel: {
        type: 'checkbox',
        label: $t('Enable Browser Source Hardware Acceleration (requires a restart)'),
      },
    };
  }

  get mediaMetadata() {
    return { caching: { type: 'checkbox', label: $t('Enable media file caching') } };
  }

  get delaySettingsMetadata() {
    return {
      enabled: { type: 'toggle', label: $t('Enabled') },
      delaySec: { type: 'number', label: $t('Duration (seconds)') },
      preserveDelay: {
        type: 'checkbox',
        label: $t('Preserved cutoff point (increase delay) when reconnecting'),
      },
    };
  }

  get reconnectSettingsMetadata() {
    return {
      enabled: { type: 'toggle', label: $t('Enabled') },
      retryDelay: { type: 'number', label: $t('Retry Delay (seconds)') },
      maxRetries: { type: 'number', label: $t('Maximum Retries') },
    };
  }

  get networkSettingsMetadata() {
    return {
      bindIP: {
        type: 'list',
        label: $t('Bind to IP'),
        options: this.service.getInterfaceOptions(),
      },
      enableDynamicBitrate: {
        type: 'checkbox',
        label: $t('Dynamically change bitrate when dropping frames while streaming'),
      },
      enableOptimizations: { type: 'checkbox', label: $t('Enable new networking code') },
      enableLowLatency: { type: 'checkbox', label: $t('Low latency mode') },
    };
  }

  get videoMetadata() {
    return {
      outputFormat: {
        type: 'list',
        label: $t('Color Format'),
        options: [
          { label: 'NV12 (8-bit, 4:2:0, 2 planes)', value: obs.EVideoFormat.NV12 },
          { label: 'I420', value: obs.EVideoFormat.I420 },
          { label: 'I444', value: obs.EVideoFormat.I444 },
          { label: 'RGB', value: obs.EVideoFormat.RGBA },
        ],
        onChange: (val: obs.EVideoFormat) =>
          this.videoService.actions.setVideoSetting('outputFormat', val),
      },
      colorSpace: {
        type: 'list',
        label: $t('YUV Color Space'),
        options: [
          { label: '601', value: obs.EColorSpace.CS601 },
          { label: 'Rec. 709', value: obs.EColorSpace.CS709 },
        ],
        onChange: (val: obs.EColorSpace) =>
          this.videoService.actions.setVideoSetting('colorSpace', val),
      },
      range: {
        type: 'list',
        label: $t('YUV Color Range'),
        options: [
          { label: $t('Partial'), value: obs.ERangeType.Partial },
          { label: $t('Full'), value: obs.ERangeType.Full },
        ],
        onChange: (val: obs.ERangeType) => this.videoService.actions.setVideoSetting('range', val),
      },
      forceGPU: { type: 'checkbox', label: $t('Force GPU as render device') },
    };
  }

  get replaySettingsMetadata() {
    return {
      prefix: {
        type: 'text',
        label: $t('Replay Buffer Filename Prefix'),
        onChange: (val: string) => this.outputsService.actions.setReplaySetting('prefix', val),
      },
      suffix: {
        type: 'text',
        label: $t('Replay Buffer Filename Suffix'),
        onChange: (val: string) => this.outputsService.actions.setReplaySetting('suffix', val),
      },
    };
  }

  get recordingSettingsMetadata() {
    return {
      fileFormat: {
        type: 'text',
        label: $t('Filename Formatting'),
        onChange: (val: string) =>
          this.outputsService.actions.setRecordingSetting('fileFormat', val),
      },
      overwrite: {
        type: 'checkbox',
        label: $t('Overwrite if file exists'),
        onChange: (val: boolean) =>
          this.outputsService.actions.setRecordingSetting('overwrite', val),
      },
    };
  }

  get audioSettingsMetadata() {
    return {
      monitoringDevice: {
        type: 'list',
        label: $t('Audio Monitoring Device'),
        onChange: (val: string) =>
          this.audioService.actions.setAdvancedValue('monitoringDevice', val),
        options: this.audioService.getMonitoringDeviceOptions(),
      },
      disableAudioDucking: {
        type: 'checkbox',
        label: $t('Disable Windows audio ducking'),
        onChange: (val: boolean) =>
          this.audioService.actions.setAdvancedValue('disableAudioDucking', val),
        displayed: getOS() === OS.Windows,
      },
    };
  }

  get metadata() {
    return {
      delay: { header: $t('Stream Delay'), data: this.delaySettingsMetadata },
      reconnect: {
        header: $t('Automatically Reconnect'),
        data: this.reconnectSettingsMetadata,
      },
      network: { header: $t('Network'), data: this.networkSettingsMetadata },
    };
  }

  get otherServiceMetadata() {
    return {
      video: { header: $t('Video'), data: this.videoMetadata },
      audio: { header: $t('Audio'), data: this.audioSettingsMetadata },
      recording: { header: $t('Recording'), data: this.recordingSettingsMetadata },
      replay: { header: $t('Replay Buffer'), data: this.replaySettingsMetadata },
    };
  }

  get categories() {
    return this.service.views.streamSettingsCategories;
  }

  onAdvancedChange(category: string) {
    return (key: string) => (val: unknown) =>
      this.service.actions.setAdvancedSetting(category, key, val);
  }

  onMiscChange(key: string) {
    return (val: unknown) => this.service.actions.setMiscSetting(key, val);
  }
}

export function AdvancedSettings() {
  const {
    categories,
    generalMetadata,
    generalValues,
    sourcesMetadata,
    sourcesValues,
    mediaMetadata,
    mediaValues,
    metadata,
    otherServiceMetadata,
    otherServiceValues,
    advancedValues,
    onAdvancedChange,
    onMiscChange,
  } = useModule(AdvancedSettingsModule);

  const otherServiceCategories = Object.keys(otherServiceMetadata);

  return (
    <>
      <div className={styles.formSection}>
        <h2>{$t('General')}</h2>
        <FormFactory
          values={generalValues}
          metadata={generalMetadata}
          onChange={onMiscChange}
          formOptions={{ layout: 'vertical' }}
        />
      </div>
      {otherServiceCategories.map(category => {
        const meta = otherServiceMetadata[category];
        return (
          <div key={category} className={styles.formSection}>
            <h2>{meta.header}</h2>
            <FormFactory
              values={otherServiceValues[category]}
              metadata={meta.data}
              formOptions={{ layout: 'vertical' }}
            />
          </div>
        );
      })}
      {categories.map(category => {
        const meta = metadata[category];
        return (
          <div key={category} className={styles.formSection}>
            <h2>{meta.header}</h2>
            <FormFactory
              values={advancedValues(category)}
              metadata={meta.data}
              onChange={onAdvancedChange(category)}
              formOptions={{ layout: 'vertical' }}
            />
          </div>
        );
      })}
      <div className={styles.formSection}>
        <h2>{$t('Sources')}</h2>
        <FormFactory
          values={sourcesValues}
          metadata={sourcesMetadata}
          onChange={onMiscChange}
          formOptions={{ layout: 'vertical' }}
        />
      </div>
      <div className={styles.formSection}>
        <h2>{$t('Media Files')}</h2>
        <FormFactory
          values={mediaValues}
          metadata={mediaMetadata}
          onChange={onMiscChange}
          formOptions={{ layout: 'vertical' }}
        />
      </div>
    </>
  );
}

AdvancedSettings.page = 'Advanced';
