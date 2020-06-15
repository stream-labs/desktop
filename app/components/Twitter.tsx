import Vue from 'vue';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { TwitterService } from 'services/integrations/twitter';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { $t } from 'services/i18n';
import { TextArea } from 'streamlabs-beaker';
import { ToggleInput } from 'components/shared/inputs/inputs';
import { UserService } from 'services/user';
import electron from 'electron';

import cx from 'classnames';
import styles from './Twitter.m.less';
import { WindowsService } from 'services/windows';

class TwitterProps {
  streamTitle: string = '';
  value?: string = '';
}

@Component({ props: createProps(TwitterProps) })
export class Twitter extends TsxComponent<TwitterProps> {
  @Inject() twitterService: TwitterService;
  @Inject() userService: UserService;
  @Inject() windowsService: WindowsService;

  priorTitle: string = '';
  private loading = false;
  private tweetText: string;
  private posted = false;

  get isTwitch() {
    return this.userService.platform.type === 'twitch';
  }

  get isPrime() {
    return this.twitterService.state.prime;
  }

  get hasTwitter() {
    return this.twitterService.state.linked;
  }

  get shouldTweet() {
    return this.twitterService.state.tweetWhenGoingLive;
  }

  get twitterScreenName() {
    return this.twitterService.state.screenName;
  }

  get csOnboardingComplete() {
    return this.twitterService.state.creatorSiteOnboardingComplete;
  }

  get siteUrl() {
    return this.twitterService.state.creatorSiteUrl;
  }

  linkTwitter() {
    this.twitterService.openLinkTwitterDialog();
  }

  unlinkTwitter() {
    this.twitterService.unlinkTwitter().then(() => this.getTwitterStatus());
  }

  private async share() {
    this.loading = true;
    try {
      await this.twitterService.postTweet(this.props.value);
      this.posted = true;
    } catch (e) {
      this.$toasted.show(e.error, {
        position: 'bottom-center',
        className: 'toast-alert',
        duration: 1000,
        singleton: true,
      });
    }
    this.loading = false;
  }

  async getTwitterStatus() {
    await this.twitterService.getTwitterStatus();
  }

  async created() {
    this.tweetText = this.props.value;
    this.priorTitle = this.props.streamTitle;
    await this.getTwitterStatus();
  }

  get tweetInput() {
    return (
      <TextArea
        name="tweetInput"
        disabled={this.loading}
        value={this.tweetText}
        autoResize="true"
        label={$t('Compose Tweet')}
        class={styles.twitterTweetInput}
        placeholder="Come check out my stream"
        maxLength={280}
        maxHeight={140}
        slot="input"
      />
    );
  }

  get unlinkedView() {
    return (
      <div class={styles.section}>
        <p class={styles.twitterShareText}>{$t('Share Your Stream')}</p>
        <p>{$t("Tweet to let your followers know you're going live")}</p>
        <button class="button button--default" onClick={this.linkTwitter}>
          {$t('Connect to Twitter')} <i class="fab fa-twitter" />
        </button>
      </div>
    );
  }

  get linkedView() {
    return (
      <div class={cx('section', styles.section)}>
        <p class={styles.twitterShareText}>{$t('Share Your Stream')}</p>
        <div class={styles.twitterRow}>
          <p>@{this.twitterScreenName}</p>
        </div>
        {this.tweetInput}
        <div class={styles.twitterButtons}>
          <button
            class={cx('button', 'button--default', styles.adjustButton)}
            onClick={this.unlinkTwitter}
          >
            {$t('Unlink Twitter')}
          </button>
          <button
            disabled={this.loading}
            class={cx('button', 'button--action', styles.adjustButton)}
            onclick={() => this.share()}
          >
            {$t('Share')}
          </button>
        </div>
      </div>
    );
  }

  get postedView() {
    return <div class={cx('section', styles.section)}>{$t('Your tween has been posted')}</div>;
  }

  render() {
    if (this.posted) return this.postedView;
    if (!this.hasTwitter) return this.unlinkedView;
    if (this.hasTwitter) return this.linkedView;
  }
}
