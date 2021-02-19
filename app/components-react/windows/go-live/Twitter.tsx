import React from 'react';
import InputWrapper from '../../shared/inputs/InputWrapper';
import { useOnCreate, useVuex } from '../../hooks';
import { Services } from '../../service-provider';
import cx from 'classnames';
import { $t } from '../../../services/i18n';
import css from './Twitter.m.less';
import { SwitchInput, TextAreaInput, TSlobsInputProps, TextInput } from '../../shared/inputs';
import { pick } from 'lodash';
import { assertIsDefined } from '../../../util/properties-type-guards';
import { Row, Col } from 'antd';

export default function TwitterInput(
  p: TSlobsInputProps<{ streamTitle: string; onChange: (tweetText: string) => unknown }, string>,
) {
  const { TwitterService, UserService } = Services;
  const v = useVuex(() => ({
    ...pick(
      TwitterService.state,
      'tweetWhenGoingLive',
      'linked',
      'screenName',
      'creatorSiteUrl',
      'creatorSiteOnboardingComplete',
    ),
    isTwitch: UserService.platform?.type === 'twitch',
  }));

  useOnCreate(async () => {
    await TwitterService.actions.return.getTwitterStatus();
    assertIsDefined(v.creatorSiteUrl);
    assertIsDefined(UserService.platform);
    let url = `${v.creatorSiteUrl}/home`;
    if (!v.creatorSiteOnboardingComplete && v.isTwitch) {
      url = `https://twitch.tv/${UserService.platform.username}`;
    }
    p.onChange(`${p.streamTitle} ${url}`);
  });

  function unlink() {
    TwitterService.actions.return
      .unlinkTwitter()
      .then(() => TwitterService.actions.getTwitterStatus());
  }

  function renderLinkedView() {
    return (
      <div className={cx('section', css.section)}>
        <p className={css.twitterShareText}>{$t('Share Your Stream')}</p>
        <Row>
          <Col span={14}>
            <SwitchInput
              label={$t('Enable Tweet Sharing')}
              onChange={shouldTweet => TwitterService.actions.setTweetPreference(shouldTweet)}
              value={v.tweetWhenGoingLive}
              className={css.twitterTweetToggle}
            />
          </Col>
          <Col span={10} style={{ textAlign: 'right' }}>
            <InputWrapper>@{v.screenName}</InputWrapper>
          </Col>
        </Row>

        <TextAreaInput
          {...p}
          nowrap={true}
          showCount={true}
          autoSize={true}
          maxLength={280}
          disabled={!v.tweetWhenGoingLive}
        />
        <div className={css.twitterButtons}>
          <button className={cx('button', 'button--default', css.adjustButton)} onClick={unlink}>
            {$t('Unlink Twitter')}
          </button>
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

  return <InputWrapper>{v.linked ? renderLinkedView() : renderUnlinkedView()}</InputWrapper>;
}
