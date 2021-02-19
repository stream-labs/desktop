import { IGoLiveSettings, IStreamSettings } from '../../../../../services/streaming';
import { isAdvancedMode, TUpdatePlatformSettingsFn } from '../../go-live';
import { TPlatform } from '../../../../../services/platforms';
import FormSection from '../../../../shared/inputs/FormSection';
import CommonPlatformFields from '../../CommonPlatformFields';
import { CheckboxInput, ListInput } from '../../../../shared/inputs';
import React, { useState } from 'react';
import { Services } from '../../../../service-provider';
import { $t } from '../../../../../services/i18n';
import { IYoutubeStartStreamOptions } from '../../../../../services/platforms/youtube';
import { createBinding } from '../../../../shared/inputs/inputs';
import BroadcastInput from './BroadcastInput';
import { useAsyncState, useOnCreate } from '../../../../hooks';
import InputWrapper from '../../../../shared/inputs/InputWrapper';
import { TwitchTagsInput } from '../TwitchTagsInput';
import GameSelector from '../../GameSelector';

interface IProps {
  settings: IGoLiveSettings;
  updatePlatformSettings: TUpdatePlatformSettingsFn;
  isScheduleMode?: boolean;
  isUpdateMode?: boolean;
}

/***
 * Stream Settings for YT
 */
export function YoutubeEditStreamInfo(p: IProps) {
  const { settings, updatePlatformSettings, isScheduleMode, isUpdateMode } = p;
  const { StreamingService, YoutubeService } = Services;
  const view = StreamingService.views;
  const ytSettings = settings.platforms.youtube;
  const isAdvanced = isAdvancedMode(settings);
  const is360video = ytSettings.projection === '360';
  const shouldShowSafeForKidsWarn = ytSettings.selfDeclaredMadeForKids;
  const vModel = createBinding(
    ytSettings,
    newYtSettings => updatePlatformSettings('youtube', newYtSettings),
    fieldName => ({ disabled: fieldIsDisabled(fieldName) }),
  );

  const [s] = useAsyncState({ broadcastLoading: true, broadcasts: [] }, async () => {
    return {
      broadcastLoading: false,
      broadcasts: await YoutubeService.actions.return.fetchBroadcasts(),
    };
  });

  function fieldIsDisabled(fieldName: keyof IGoLiveSettings['platforms']['youtube']): boolean {
    // TODO:
    return false;
    // const selectedBroadcast = this.selectedBroadcast;
    //
    // // selfDeclaredMadeForKids can be set only on the broadcast creating step
    // if (selectedBroadcast && fieldName === 'selfDeclaredMadeForKids') {
    //   return true;
    // }
    //
    // if (!this.view.isMidStreamMode) return false;
    // return !this.youtubeService.updatableSettings.includes(fieldName);
  }

  function projectionChangeHandler(enable360: boolean) {
    updatePlatformSettings('youtube', { projection: enable360 ? '360' : 'rectangular' });
  }

  function render() {
    return (
      <FormSection name="youtube-settings">
        {isAdvanced
          ? [renderOptionalFields(), renderCommonFields()]
          : [renderCommonFields(), renderOptionalFields()]}
      </FormSection>
    );
  }

  function renderCommonFields() {
    return <CommonPlatformFields key="common" {...p} platform="youtube" />;
  }

  function renderOptionalFields() {
    return (
      <div key="optional">
        {!p.isScheduleMode && (
          <BroadcastInput
            label={$t('Event')}
            loading={s.broadcastLoading}
            broadcasts={s.broadcasts}
            disabled={view.isMidStreamMode}
          />
        )}
        <ListInput
          {...vModel('privacyStatus')}
          label={$t('Privacy')}
          options={[
            {
              value: 'public',
              label: $t('Public'),
              description: $t('Anyone can search for and view'),
            },
            {
              value: 'unlisted',
              label: $t('Unlisted'),
              description: $t('Anyone with the link can view'),
            },
            { value: 'private', label: $t('Private'), description: $t('Only you can view') },
          ]}
        />
        <ListInput
          {...vModel('categoryId')}
          label={$t('Category')}
          showSearch
          options={YoutubeService.state.categories.map(category => ({
            value: category.id,
            label: category.snippet.title,
          }))}
        />
        {/*<HFormGroup title={this.formMetadata.thumbnail.title}>*/}
        {/*  <FormInput*/}
        {/*    metadata={this.formMetadata.thumbnail}*/}
        {/*    vModel={this.settings.platforms.youtube.thumbnail}*/}
        {/*  />*/}
        {/*  <div class="input-description">*/}
        {/*    <a onclick={() => this.openThumbnailsEditor()}>{$t('Try our new thumbnail editor')}</a>*/}
        {/*  </div>*/}
        {/*</HFormGroup>*/}

        {/* TODO: add description */}
        <ListInput
          label={$t('Stream Latency')}
          tooltip={$t('latencyTooltip')}
          options={[
            { value: 'normal', label: $t('Normal Latency') },
            { value: 'low', label: $t('Low-latency') },
            {
              value: 'ultraLow',
              label: $t('Ultra low-latency'),
            },
          ]}
          {...vModel('latencyPreference')}
        />

        <InputWrapper label={$t('Additional Settings')}>
          {!isScheduleMode && (
            <CheckboxInput
              {...vModel('enableAutoStart')}
              label={$t('Enable Auto-start')}
              tooltip={$t(
                'Enabling auto-start will automatically start the stream when you start sending data from your streaming software',
              )}
            />
          )}
          {!isScheduleMode && (
            <CheckboxInput
              {...vModel('enableAutoStop')}
              label={$t('Enable Auto-stop')}
              tooltip={$t(
                'Enabling auto-stop will automatically stop the stream when you stop sending data from your streaming software',
              )}
            />
          )}
          <CheckboxInput
            {...vModel('enableDvr')}
            label={$t('Enable DVR')}
            tooltip={$t(
              'DVR controls enable the viewer to control the video playback experience by pausing, rewinding, or fast forwarding content',
            )}
          />
          <CheckboxInput
            label={$t('360° video')}
            value={is360video}
            onChange={projectionChangeHandler}
          />
          <CheckboxInput label={$t('Made for kids')} {...vModel('selfDeclaredMadeForKids')} />
          {shouldShowSafeForKidsWarn && (
            <p>
              {$t(
                "Features like personalized ads and live chat won't be available on live streams made for kids.",
              )}
            </p>
          )}
        </InputWrapper>
      </div>
    );
  }

  return render();
}
