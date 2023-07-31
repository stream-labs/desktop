import React from 'react';
import InputWrapper from '../../shared/inputs/InputWrapper';
import { Services } from '../../service-provider';
import cx from 'classnames';
import { $t } from '../../../services/i18n';
import css from './Twitter.m.less';
import { CheckboxInput, SwitchInput, TextAreaInput, TextInput } from '../../shared/inputs';
import { Row, Col, Tooltip } from 'antd';
import { useGoLiveSettings } from './useGoLiveSettings';
import { injectWatch } from 'slap';

export default function TwitterInput() {
  const { TwitterService, UserService } = Services;
  const {
    tweetText,
    updateSettings,
    tweetWhenGoingLive,
    screenName,
    platform,
    useStreamlabsUrl,
  } = useGoLiveSettings().extend(module => {
    function getTwitterState() {
      return {
        streamTitle: module.state.commonFields.title,
        useStreamlabsUrl: TwitterService.state.creatorSiteOnboardingComplete,
      };
    }

    return {
      get streamTitle() {
        return module.state.commonFields.title;
      },
      get tweetWhenGoingLive() {
        return TwitterService.state.tweetWhenGoingLive;
      },
      get useStreamlabsUrl() {
        return TwitterService.state.creatorSiteOnboardingComplete;
      },

      get screenName() {
        return TwitterService.state.screenName;
      },

      get platform() {
        return UserService.views.platform?.type;
      },

      get url() {
        return TwitterService.views.url;
      },

      tweetTextWatch: injectWatch(getTwitterState, () => {
        const tweetText = module.getTweetText(getTwitterState().streamTitle);
        module.updateSettings({ tweetText });
      }),
    };
  });

  function setUseStreamlabsUrl(value: boolean) {
    TwitterService.actions.setStreamlabsUrl(value);
  }

  function renderLinkedView() {
    return (
      <>
        <SwitchInput
          label={
            <Tooltip
              title={$t(
                'Due to recent Twitter API limitations enabling this option will open a browser window for you to tweet instead of automatically tweeting on your behalf.',
              )}
            >
              <span>Enable Tweet Sharing</span>
            </Tooltip>
          }
          layout="inline"
          onChange={shouldTweet => TwitterService.actions.setTweetPreference(shouldTweet)}
          value={tweetWhenGoingLive}
          className={css.twitterTweetToggle}
        />
        {tweetWhenGoingLive && (
          <div className={css.container}>
            <TextAreaInput
              name="tweetText"
              value={tweetText}
              onChange={tweetText => updateSettings({ tweetText })}
              nowrap={true}
              showCount={true}
              maxLength={280}
              rows={5}
            />
            {['twitch', 'trovo'].includes(platform!) && (
              <CheckboxInput
                value={useStreamlabsUrl}
                onInput={setUseStreamlabsUrl}
                label={$t('Use Streamlabs URL')}
              />
            )}
          </div>
        )}
      </>
    );
  }

  // Since we're opening the browser to tweet, linking isn't necessary. TODO: rename method
  return <InputWrapper label={$t('Share Your Stream')}>{renderLinkedView()}</InputWrapper>;
}
