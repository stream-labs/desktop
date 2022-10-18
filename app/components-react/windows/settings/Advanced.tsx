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

  advancedValues(category: string) {
    return this.service.views.advancedSettingsValues(category);
  }

  get delayMetadata() {
    return this.service.delaySettingsMetadata;
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
    onVideoChange,
    advancedValues,
    onAdvancedChange,
    delayMetadata,
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
      </div>
      <div>
        <h2>{$t('Replay Buffer')}</h2>
      </div>
      <div>
        <h2>{$t('Stream Delay')}</h2>
        <FormFactory
          values={advancedValues('delay')}
          metadata={delayMetadata}
          onChange={onAdvancedChange('delay')}
          formOptions={{ layout: 'vertical' }}
        />
      </div>
      <div>
        <h2>{$t('Automatically Reconnect')}</h2>
      </div>
      <div>
        <h2>{$t('Network')}</h2>
      </div>
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
