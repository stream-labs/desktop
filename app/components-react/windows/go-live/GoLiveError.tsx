import React from 'react';
import { useVuex } from '../../hooks';
import { Services } from '../../service-provider';
import { IStreamError } from '../../../services/streaming/stream-error';
import MessageLayout from './MessageLayout';
import { assertIsDefined } from '../../../util/properties-type-guards';
import { getPlatformService, TPlatform } from '../../../services/platforms';
import { $t } from '../../../services/i18n';
import Translate from '../../shared/Translate';
import css from './GoLiveError.m.less';

/**
 * Shows an error and troubleshooting suggestions
 */
export default function GoLiveError() {
  const {
    StreamingService,
    YoutubeService,
    UserService,
    NavigationService,
    WindowsService,
    MagicLinkService,
  } = Services;

  // take an error from the global state
  const { error } = useVuex(() => ({ error: StreamingService.state.info.error }), false);

  function render() {
    if (!error) return null;
    const type = error.type || 'UNKNOWN_ERROR';

    switch (type) {
      case 'PREPOPULATE_FAILED':
        return renderPrepopulateError(error);
      case 'PRIME_REQUIRED':
        return renderPrimeRequiredError();
      case 'TWITCH_MISSED_OAUTH_SCOPE':
        return renderTwitchMissedScopeError(error);
      case 'SETTINGS_UPDATE_FAILED':
        return renderSettingsUpdateError(error);
      case 'RESTREAM_DISABLED':
      case 'RESTREAM_SETUP_FAILED':
        return renderRestreamError(error);
      case 'YOUTUBE_STREAMING_DISABLED':
        return renderYoutubeStreamingDisabled(error);
      case 'MACHINE_LOCKED':
        return renderMachineLockedError(error);
      case 'TWEET_FAILED':
        return renderTweetFailedError(error);
      default:
        return <MessageLayout error={error} />;
    }
  }

  function renderPrepopulateError(error: IStreamError) {
    assertIsDefined(error.platform);
    const platformName = getPlatformService(error.platform).displayName;
    const actions = StreamingService.actions;
    return (
      <MessageLayout
        error={error}
        message={$t('Failed to fetch settings from %{platformName}', { platformName })}
      >
        <Translate message={$t('prepopulateStreamSettingsError')}>
          <a slot="fetchAgainLink" className={css.link} onClick={() => actions.prepopulateInfo()} />
          <a slot="justGoLiveLink" className={css.link} onClick={() => actions.goLive()} />
        </Translate>
      </MessageLayout>
    );
  }

  function renderPrimeRequiredError() {
    return (
      <MessageLayout
        type={'error'}
        message={$t('Multistreaming to these platforms requires Prime')}
      >
        <button
          className="button button--prime"
          onClick={() => MagicLinkService.actions.linkToPrime('slobs-multistream')}
        >
          {$t('Become a Prime member')}
        </button>
      </MessageLayout>
    );
  }

  function renderTwitchMissedScopeError(error: IStreamError) {
    // If primary platform, then ask to re-login
    if (UserService.state.auth?.primaryPlatform === 'twitch') {
      return renderPrepopulateError(error);
    }

    function navigatePlatformMerge() {
      NavigationService.actions.navigate('PlatformMerge', { platform: 'twitch' });
      WindowsService.actions.closeChildWindow();
    }

    // If not primary platform than ask to connect platform again from SLOBS
    assertIsDefined(error.platform);
    const platformName = getPlatformService(error.platform).displayName;
    return (
      <MessageLayout
        message={$t('Failed to fetch settings from %{platformName}', { platformName })}
      >
        <Translate message={$t('twitchMissedScopeError')}>
          <button
            slot="connectButton"
            className="button button--twitch"
            onClick={navigatePlatformMerge}
          />
        </Translate>
      </MessageLayout>
    );
  }

  function renderSettingsUpdateError(error: IStreamError) {
    assertIsDefined(error.platform);
    const platformName = getPlatformService(error.platform).displayName;

    function tryAgain() {
      const actions = StreamingService.actions;
      const settings = StreamingService.views.info.settings;
      assertIsDefined(settings);
      if (WindowsService.state.child.componentName === 'EditStreamWindow') {
        actions.updateStreamSettings(settings);
      } else {
        actions.goLive(settings);
      }
    }

    function skipSettingsUpdateAndGoLive() {
      StreamingService.actions.finishStartStreaming();
      WindowsService.actions.closeChildWindow();
    }

    return (
      <MessageLayout
        error={error}
        message={$t('Failed to update settings for %{platformName}', { platformName })}
      >
        <Translate message={$t('updateStreamSettingsError')}>
          <a slot="tryAgainLink" className={css.link} onClick={tryAgain} />
          <a slot="justGoLiveLink" className={css.link} onClick={skipSettingsUpdateAndGoLive} />
        </Translate>
      </MessageLayout>
    );
  }

  function renderTweetFailedError(error: IStreamError) {
    return <MessageLayout error={error} message={$t('Failed to post the Tweet')}></MessageLayout>;
  }

  function renderRestreamError(error: IStreamError) {
    return (
      <MessageLayout error={error}>
        {$t(
          'Please try again. If the issue persists, you can stream directly to a single platform instead.',
        )}
      </MessageLayout>
    );
  }

  function renderYoutubeStreamingDisabled(error: IStreamError) {
    return (
      <MessageLayout message={error.message}>
        {$t(
          'Please enable your account for live streaming, and wait 24 hours before attempting to stream.',
        )}
        <br />
        <button
          className="button button--warn"
          style={{ marginTop: '8px' }}
          onClick={() => YoutubeService.actions.openYoutubeEnable()}
        >
          {$t('Enable Live Streaming')}
        </button>
      </MessageLayout>
    );
  }

  function renderMachineLockedError(error: IStreamError) {
    return (
      <MessageLayout error={error}>
        {$t('You could try locking and unlocking your computer to fix this error.')}
      </MessageLayout>
    );
  }

  return render();
}
