import { IGoLiveSettings, IStreamSettings } from '../../../../../services/streaming';
import { TPlatform } from '../../../../../services/platforms';
import CommonPlatformFields from '../../CommonPlatformFields';
import { CheckboxInput, ImageInput, ListInput } from '../../../../shared/inputs';
import React, { useEffect, useState } from 'react';
import { Services } from '../../../../service-provider';
import { $t } from '../../../../../services/i18n';
import { IYoutubeStartStreamOptions } from '../../../../../services/platforms/youtube';
import { createBinding } from '../../../../shared/inputs/inputs';
import BroadcastInput from './BroadcastInput';
import { useAsyncState, useOnCreate } from '../../../../hooks';
import InputWrapper from '../../../../shared/inputs/InputWrapper';
import { TwitchTagsInput } from '../TwitchTagsInput';
import GameSelector from '../../GameSelector';
import Form from '../../../../shared/inputs/Form';
import { useGoLiveSettings } from '../../go-live';
import electron from 'electron';

/***
 * Stream Settings for YT
 */
export function YoutubeEditStreamInfo() {
  const { YoutubeService } = Services;
  const {
    updatePlatform,
    ytSettings,
    isUpdateMode,
    isScheduleMode,
    renderPlatformSettings,
  } = useGoLiveSettings('YoutubeEditStreamInfo', view => ({
    ytSettings: view.platforms.youtube,
  }));
  const is360video = ytSettings.projection === '360';
  const shouldShowSafeForKidsWarn = ytSettings.selfDeclaredMadeForKids;
  const broadcastId = ytSettings.broadcastId;
  const bind = createBinding(
    ytSettings,
    newYtSettings => updatePlatform('youtube', newYtSettings),
    fieldName => ({ disabled: fieldIsDisabled(fieldName) }),
  );

  const [{ broadcastLoading, broadcasts }] = useAsyncState(
    { broadcastLoading: true, broadcasts: [] },
    async () => {
      return {
        broadcastLoading: false,
        broadcasts: await YoutubeService.actions.return.fetchBroadcasts(),
      };
    },
  );

  useEffect(() => {
    if (!broadcastId) return;
    YoutubeService.actions.return
      .fetchStartStreamOptionsForBroadcast(broadcastId)
      .then(newYtSettings => {
        updatePlatform('youtube', newYtSettings);
      });
  }, [broadcastId]);

  function openThumbnailsEditor() {
    electron.remote.shell.openExternal(
      'https://streamlabs.com/dashboard#/prime/thumbnails?refl=slobs-thumbnail-editor',
    );
  }

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
    updatePlatform('youtube', { projection: enable360 ? '360' : 'rectangular' });
  }

  function renderCommonFields() {
    return <CommonPlatformFields key="common" platform="youtube" />;
  }

  function renderOptionalFields() {
    return (
      <div key="optional">
        {!isScheduleMode && (
          <BroadcastInput
            value=""
            label={$t('Event')}
            loading={broadcastLoading}
            broadcasts={broadcasts}
            disabled={isUpdateMode}
            {...bind.broadcastId}
          />
        )}
        <ListInput
          {...bind.privacyStatus}
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
          {...bind.categoryId}
          label={$t('Category')}
          showSearch
          options={YoutubeService.state.categories.map(category => ({
            value: category.id,
            label: category.snippet.title,
          }))}
        />
        <ImageInput
          label={$t('Thumbnail')}
          maxFileSize={2 * 1024 * 1024} // 2 mb
          extra={<a onClick={openThumbnailsEditor}>{$t('Try our new thumbnail editor')}</a>}
          {...bind.thumbnail}
        />

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
          {...bind.latencyPreference}
        />

        <InputWrapper label={$t('Additional Settings')}>
          {!isScheduleMode && (
            <CheckboxInput
              {...bind.enableAutoStart}
              label={$t('Enable Auto-start')}
              tooltip={$t(
                'Enabling auto-start will automatically start the stream when you start sending data from your streaming software',
              )}
            />
          )}
          {!isScheduleMode && (
            <CheckboxInput
              {...bind.enableAutoStop}
              label={$t('Enable Auto-stop')}
              tooltip={$t(
                'Enabling auto-stop will automatically stop the stream when you stop sending data from your streaming software',
              )}
            />
          )}
          <CheckboxInput
            {...bind.enableDvr}
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
          <CheckboxInput label={$t('Made for kids')} {...bind.selfDeclaredMadeForKids} />
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

  return (
    <Form name="youtube-settings">
      {renderPlatformSettings(renderCommonFields(), <div key={'empty'} />, renderOptionalFields())}
    </Form>
  );
}
