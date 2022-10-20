import React from 'react';
import { useModule } from 'slap';
import { Services } from '../../service-provider';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import styles from './Common.m.less';
import { $t } from 'services/i18n';
import * as obs from '../../../../obs-api';

class AdvancedSettingsModule {
  service = Services.AdvancedSettingsService;
  outputsService = Services.OutputsService;

  get videoValues() {
    return this.service.videoSettingsValues;
  }

  get videoMetadata() {
    return this.service.videoSettingsMetadata;
  }

  get replayMetadata() {
    return this.service.replaySettingsMetadata;
  }

  get replayValues() {
    return this.service.replaySettingsValues;
  }

  get recordingMetadata() {
    return this.service.recordingSettingsMetadata;
  }

  get recordingValues() {
    return this.service.recordingSettingsValues;
  }

  get generalMetadata() {
    return this.service.generalSettingsMetadata;
  }

  get generalValues() {
    return this.service.generalSettingsValues;
  }

  get sourcesMetadata() {
    return this.service.sourcesSettingsMetadata;
  }

  get sourcesValues() {
    return this.service.sourcesSettingsValues;
  }

  get mediaMetadata() {
    return this.service.mediaSettingsMetadata;
  }

  get mediaValues() {
    return this.service.mediaSettingsValues;
  }

  advancedValues(category: string) {
    return this.service.views.advancedSettingsValues(category);
  }

  get metadata() {
    return {
      delay: { header: $t('Stream Delay'), data: this.service.delaySettingsMetadata },
      reconnect: {
        header: $t('Automatically Reconnect'),
        data: this.service.reconnectSettingsMetadata,
      },
      network: { header: $t('Network'), data: this.service.networkSettingsMetadata },
    };
  }

  get categories() {
    return this.service.views.streamSettingsCategories;
  }

  onVideoChange(key: string) {
    return (val: unknown) => this.service.actions.setVideoSetting(key, val);
  }

  onAdvancedChange(category: string) {
    return (key: string) => (val: unknown) =>
      this.service.actions.setAdvancedSetting(category, key, val);
  }

  onMiscChange(key: string) {
    return (val: unknown) => this.service.actions.setMiscSetting(key, val);
  }

  onReplayChange(key: keyof obs.IAdvancedReplayBuffer | keyof obs.ISimpleReplayBuffer) {
    return (val: unknown) => this.outputsService.setReplaySetting(key, val);
  }

  onRecordingChange(key: keyof obs.IAdvancedRecording | keyof obs.ISimpleRecording) {
    return (val: unknown) => this.outputsService.setRecordingSetting(key, val);
  }
}

export function AdvancedSettings() {
  const {
    categories,
    videoValues,
    videoMetadata,
    replayValues,
    replayMetadata,
    recordingMetadata,
    recordingValues,
    generalMetadata,
    generalValues,
    sourcesMetadata,
    sourcesValues,
    mediaMetadata,
    mediaValues,
    metadata,
    advancedValues,
    onVideoChange,
    onAdvancedChange,
    onMiscChange,
    onReplayChange,
    onRecordingChange,
  } = useModule(AdvancedSettingsModule);

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
      <div className={styles.formSection}>
        <h2>{$t('Video')}</h2>
        <FormFactory
          values={videoValues}
          metadata={videoMetadata}
          onChange={onVideoChange}
          formOptions={{ layout: 'vertical' }}
        />
      </div>
      <div className={styles.formSection}>
        <h2>{$t('Audio')}</h2>
      </div>
      <div className={styles.formSection}>
        <h2>{$t('Recording')}</h2>
        <FormFactory
          values={recordingValues}
          metadata={recordingMetadata}
          onChange={onRecordingChange}
          formOptions={{ layout: 'vertical' }}
        />
      </div>
      <div className={styles.formSection}>
        <h2>{$t('Replay Buffer')}</h2>
        <FormFactory
          values={replayValues}
          metadata={replayMetadata}
          onChange={onReplayChange}
          formOptions={{ layout: 'vertical' }}
        />
      </div>
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
