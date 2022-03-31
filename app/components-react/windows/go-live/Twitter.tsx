import React, { useEffect, useRef } from 'react';
import InputWrapper from '../../shared/inputs/InputWrapper';
import { Services } from '../../service-provider';
import cx from 'classnames';
import { $t } from '../../../services/i18n';
import css from './Twitter.m.less';
import { CheckboxInput, SwitchInput, TextAreaInput, TextInput } from '../../shared/inputs';
import { Row, Col, Button } from 'antd';
import { useGoLiveSettings } from './useGoLiveSettings';
import { useVuex } from '../../hooks';

export default function TwitterInput() {
  const { TwitterService, UserService } = Services;
  const {
    tweetText,
    updateSettings,
    getTweetText,
    getSettings,
    streamTitle,
    tweetWhenGoingLive,
    linked,
    screenName,
    platform,
    useStreamlabsUrl,
  } = useGoLiveSettings().extend(module => {
    const state = TwitterService.state;
    return {
      get streamTitle() {
        return module.commonFields.title;
      },
      get tweetWhenGoingLive() {
        return state.tweetWhenGoingLive;
      },
      get useStreamlabsUrl() {
        return state.creatorSiteOnboardingComplete;
      },

      get linked() {
        return state.linked;
      },

      get screenName() {
        return state.screenName;
      },

      get platform() {
        return UserService.views.platform?.type;
      },

      get url() {
        return TwitterService.views.url;
      },
    };
  });

  useEffect(() => {
    const tweetText = getTweetText(streamTitle);
    if (getSettings().tweetText !== tweetText) updateSettings({ tweetText });
  }, [streamTitle, useStreamlabsUrl]);

  function unlink() {
    TwitterService.actions.return
      .unlinkTwitter()
      .then(() => TwitterService.actions.getTwitterStatus());
  }

  function setUseStreamlabsUrl(value: boolean) {
    TwitterService.actions.setStreamlabsUrl(value);
  }

  function renderLinkedView() {
    return (
      <div className={cx('section', css.section)}>
        <p className={css.twitterShareText}>{$t('Share Your Stream')}</p>
        <Row className={css.switcherRow}>
          <Col span={14}>
            <SwitchInput
              label={$t('Enable Tweet Sharing')}
              layout="inline"
              onChange={shouldTweet => TwitterService.actions.setTweetPreference(shouldTweet)}
              value={tweetWhenGoingLive}
              className={css.twitterTweetToggle}
            />
          </Col>
          <Col span={10} style={{ textAlign: 'right' }}>
            <InputWrapper layout="inline">@{screenName}</InputWrapper>
          </Col>
        </Row>

        <TextAreaInput
          name="tweetText"
          value={tweetText}
          onChange={tweetText => updateSettings({ tweetText })}
          nowrap={true}
          showCount={true}
          maxLength={280}
          rows={5}
          disabled={!tweetWhenGoingLive}
        />
        {['twitch', 'trovo'].includes(platform!) && (
          <CheckboxInput
            value={useStreamlabsUrl}
            onInput={setUseStreamlabsUrl}
            label={$t('Use Streamlabs URL')}
          />
        )}
        <div style={{ marginTop: '30px', textAlign: 'right' }}>
          <Button onClick={unlink}>{$t('Unlink Twitter')}</Button>
        </div>
      </div>
    );
  }

  function renderUnlinkedView() {
    return (
      <div className={css.section}>
        <p className={css.twitterShareText}>{$t('Share Your Stream')}</p>
        <p>{$t("Tweet to let your followers know you're going live")}</p>
        <button
          className="button button--default"
          onClick={() => TwitterService.actions.openLinkTwitterDialog()}
        >
          {$t('Connect to Twitter')} <i className="fab fa-twitter" />
        </button>
      </div>
    );
  }

  return <InputWrapper>{linked ? renderLinkedView() : renderUnlinkedView()}</InputWrapper>;
}
