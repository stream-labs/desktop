import { CommonPlatformFields } from '../CommonPlatformFields';
import React, { useEffect, useState } from 'react';
import { $t } from '../../../../services/i18n';
import { TwitchTagsInput } from './TwitchTagsInput';
import GameSelector from '../GameSelector';
import Form from '../../../shared/inputs/Form';
import PlatformSettingsLayout, { IPlatformComponentParams } from './PlatformSettingsLayout';
import { CheckboxGroup, CheckboxInput, createBinding } from '../../../shared/inputs';
import { ITwitchStartStreamOptions } from '../../../../services/platforms/twitch';
import { Services } from 'components-react/service-provider';

export function TwitchEditStreamInfo(p: IPlatformComponentParams<'twitch'>) {
  const { TwitchService } = Services;
  const twSettings = p.value;

  const [classificationOptions, setClassificationOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    async function fetchLabels() {
      setClassificationOptions(await TwitchService.actions.return.getClassificationLabels());
    }
    fetchLabels();
  }, []);

  function updateSettings(patch: Partial<ITwitchStartStreamOptions>) {
    p.onChange({ ...twSettings, ...patch });
  }

  function setClassification(key: string) {
    return (value: boolean) => {
      if (value) {
        const oldSettings = twSettings.content_classification_labels || [];
        updateSettings({ content_classification_labels: [...oldSettings, { id: key, is_enabled: true }] });
      } else {
        if (!twSettings.content_classification_labels) return;
        updateSettings({ content_classification_labels: twSettings.content_classification_labels.filter(lbl => lbl.id !== key) })
      }
    }
  }

  const bind = createBinding(twSettings, updatedSettings => updateSettings(updatedSettings));

  return (
    <Form name="twitch-settings">
      <PlatformSettingsLayout
        layoutMode={p.layoutMode}
        commonFields={
          <CommonPlatformFields
            key="common"
            platform="twitch"
            layoutMode={p.layoutMode}
            value={twSettings}
            onChange={updateSettings}
          />
        }
        requiredFields={<GameSelector key="required" platform={'twitch'} {...bind.game} />}
        optionalFields={
          <React.Fragment key="optional">
            <TwitchTagsInput label={$t('Twitch Tags')} {...bind.tags} />
            <CheckboxGroup children={{}} values={{}} onChange={setClassification} />
            <CheckboxInput label={$t('Contains branded content')} />
          </React.Fragment>
      }
      />
    </Form>
  );
}
