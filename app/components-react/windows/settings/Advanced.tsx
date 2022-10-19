import React from 'react';
import { useModule } from 'slap';
import { Services } from '../../service-provider';
import FormFactory from 'components-react/shared/inputs/FormFactory';
import styles from './Common.m.less';
import { $t } from 'services/i18n';

class AdvancedSettingsModule {
  service = Services.AdvancedSettingsService;

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
    return this.service.views.advancedSettingsCategories;
  }

  onVideoChange(key: string) {
    return (val: unknown) => this.service.actions.setVideoSetting(key, val);
  }

  onAdvancedChange(category: string) {
    return (key: string) => (val: unknown) =>
      this.service.actions.setAdvancedSetting(category, key, val);
  }
}

export function AdvancedSettings() {
  const {
    videoValues,
    videoMetadata,
    replayValues,
    replayMetadata,
    recordingMetadata,
    recordingValues,
    onVideoChange,
    advancedValues,
    onAdvancedChange,
    metadata,
    categories,
  } = useModule(AdvancedSettingsModule);

  return (
    <>
      <div>
        <h2>{$t('General')}</h2>
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
      <div>
        <h2>{$t('Audio')}</h2>
      </div>
      <div>
        <h2>{$t('Recording')}</h2>
        <FormFactory
          values={recordingValues}
          metadata={recordingMetadata}
          // onChange={onVideoChange}
          formOptions={{ layout: 'vertical' }}
        />
      </div>
      <div>
        <h2>{$t('Replay Buffer')}</h2>
        <FormFactory
          values={replayValues}
          metadata={replayMetadata}
          // onChange={onVideoChange}
          formOptions={{ layout: 'vertical' }}
        />
      </div>
      {categories.map(category => {
        const meta = metadata[category];
        return (
          <div>
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
      <div>
        <h2>{$t('Sources')}</h2>
      </div>
      <div>
        <h2>{$t('Media Files')}</h2>
      </div>
    </>
  );
}

AdvancedSettings.page = 'Advanced';
