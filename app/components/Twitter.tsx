import Vue from 'vue';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { TwitterService } from 'services/integrations/twitter';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { $t } from 'services/i18n';
import { shell } from 'electron';
import { TextArea } from 'streamlabs-beaker';
import { ToggleInput } from 'components/shared/inputs/inputs';
import { UserService } from 'services/user';

import cx from 'classnames';
import styles from './Twitter.m.less';

class TwitterProps {
  streamTitle: string = '';
  midStreamMode: boolean = false;
  updatingInfo: boolean = false;
  value: string = '';
}

@Component({ props: createProps(TwitterProps) })
export class Twitter extends TsxComponent<TwitterProps> {
  @Inject() twitterService: TwitterService;
  @Inject() userService: UserService;

  priorTitle: string = '';

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

  get composeTweetText() {
    return $t('Compose Tweet');
  }

  linkTwitter() {
    this.twitterService.openLinkTwitterDialog();
  }

  unlinkTwitter() {
    this.twitterService.unlinkTwitter().then(() => this.getTwitterStatus());
  }

  setInitialTweetBody() {
    let url = `${this.siteUrl}/home`;
    if (!this.csOnboardingComplete && this.isTwitch) {
      url = `https://twitch.tv/${this.userService.platform.username}`;
    }
    this.onTweetChange(`${this.props.streamTitle} ${url}`);
  }

  async getTwitterStatus() {
    await this.twitterService.getTwitterStatus();
  }

  async created() {
    await this.getTwitterStatus();
    this.priorTitle = this.props.streamTitle;
    this.setInitialTweetBody();
  }

  updateTweetModel(tweet: string) {
    this.onTweetChange(tweet);
  }

  updateShouldTweet(shouldTweet: boolean) {
    this.twitterService.setTweetPreference(shouldTweet);
  }

  onTweetChange(tweet: string) {
    this.$emit('input', tweet);
  }

  @Watch('siteUrl')
  onSiteUrlChange() {
    this.setInitialTweetBody();
  }

  @Watch('streamTitle')
  onTitleUpdate(title: string) {
    const newTweet = this.props.value.replace(this.priorTitle, title);
    if (this.props.value.indexOf(this.priorTitle) !== -1 && newTweet.length <= 280) {
      this.onTweetChange(newTweet);
    }
    this.priorTitle = title;
  }

  get tweetInput() {
    return (
      <TextArea
        name="tweetInput"
        onInput={this.updateTweetModel.bind(this)}
        value={this.props.value}
        autoResize="true"
        label={this.composeTweetText}
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
        <button
          class="button button--default"
          disabled={this.props.updatingInfo}
          onClick={this.linkTwitter}
        >
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
          <div class={styles.twitterToggleBlock}>
            <span>{$t('Enable Tweet Sharing')}</span>
            <ToggleInput
              onInput={(shouldTweet: boolean) => this.updateShouldTweet(shouldTweet)}
              value={this.shouldTweet}
              class={styles.twitterTweetToggle}
              metadata={{ title: $t('Tweet when going live') }}
            />
          </div>
          <p>@{this.twitterScreenName}</p>
        </div>
        {this.tweetInput}
        <div class={styles.twitterButtons}>
          <button
            class={cx('button', 'button--default', styles.adjustButton)}
            disabled={this.props.updatingInfo}
            onClick={this.unlinkTwitter}
          >
            {$t('Unlink Twitter')}
          </button>
        </div>
      </div>
    );
  }

  get twitter() {
    if (!this.props.updatingInfo && !this.hasTwitter) return this.unlinkedView;
    if (this.hasTwitter) return this.linkedView;
  }

  render() {
    if (!this.props.midStreamMode) {
      return <HFormGroup metadata={{}}>{this.twitter}</HFormGroup>;
    }
  }
}
