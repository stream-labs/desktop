import Vue from 'vue';
import TsxComponent from 'components/tsx-component';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { TwitterService } from 'services/integrations/twitter';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { $t } from 'services/i18n';
import { shell } from 'electron';
import { Spinner, TextArea, Button } from 'streamlabs-beaker';
import { ToggleInput } from 'components/shared/inputs/inputs';
import { UserService } from 'services/user';

import cx from 'classnames';
import styles from './Twitter.m.less';

@Component({})
export class Twitter extends TsxComponent<{
  streamTtitle: string;
  midStreamMode: boolean;
  updatingInfo: boolean;
  value: string;
}> {
  @Inject() twitterService: TwitterService;
  @Inject() userService: UserService;

  @Prop() streamTitle: string;
  @Prop() midStreamMode: boolean;
  @Prop() updatingInfo: boolean;
  @Prop() value: string;

  priorTitle: string = '';
  shouldTweetModel: boolean = this.twitterService.state.tweetWhenGoingLive;

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

  get primeButtonText() {
    return $t('Customize your URL');
  }

  get composeTweetText() {
    return $t('Compose Tweet');
  }

  openPrime() {
    shell.openExternal('https://streamlabs.com/editor/domain?ref=slobs_twitter&redirect=false');
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
    this.onTweetChange(`${this.streamTitle} ${url}`);
  }

  async getTwitterStatus() {
    await this.twitterService.getTwitterStatus();
  }

  async created() {
    await this.getTwitterStatus();
    this.priorTitle = this.streamTitle;
    this.setInitialTweetBody();
  }

  updateTweetModel(tweet: string) {
    this.onTweetChange(tweet);
  }

  updateShouldTweetModel(shouldTweet: boolean) {
    this.shouldTweetModel = shouldTweet;
  }

  onTweetChange(tweet: string) {
    this.$emit('input', tweet);
  }

  @Watch('shouldTweetModel')
  onShouldTweetChange() {
    this.twitterService.setTweetPreference(this.shouldTweetModel);
  }

  @Watch('siteUrl')
  onSiteUrlChange() {
    this.setInitialTweetBody();
  }

  @Watch('streamTitle')
  onTitleUpdate(title: string) {
    const newTweet = this.value.replace(this.priorTitle, title);
    if (this.value.indexOf(this.priorTitle) !== -1 && newTweet.length <= 280) {
      this.onTweetChange(newTweet);
    }
    this.priorTitle = title;
  }

  primeButton(h: Function) {
    if (!this.isPrime) {
      return (
        <Button
          type="button"
          size="small"
          variation="prime"
          title={this.primeButtonText}
          onClick={this.openPrime}
        />
      );
    }
  }

  twitter(h: Function) {
    if (!this.updatingInfo && !this.hasTwitter) {
      return (
        <div class={styles.section}>
          <p class={styles.twitterShareText}>{$t('Share Your Stream')}</p>
          <p>{$t("Tweet to let your followers know you're going live")}</p>
          <button
            class="button button--default"
            disabled={this.updatingInfo}
            onClick={this.linkTwitter}
          >
            {$t('Connect to Twitter')} <i class="fab fa-twitter" />
          </button>
        </div>
      );
    }

    if (this.hasTwitter) {
      return (
        <div class={cx('section', styles.section)}>
          <p class={styles.twitterShareText}>{$t('Share Your Stream')}</p>
          <div class={styles.twitterRow}>
            <div class={styles.twitterToggleBlock}>
              <span>{$t('Enable Tweet Sharing')}</span>
              <ToggleInput
                onInput={this.updateShouldTweetModel.bind(this)}
                value={this.shouldTweetModel}
                class={styles.twitterTweetToggle}
                metadata={{ title: $t('Tweet when going live') }}
              />
            </div>
            <p>@{this.twitterScreenName}</p>
          </div>
          <TextArea
            name="tweetInput"
            onInput={this.updateTweetModel.bind(this)}
            value={this.value}
            autoResize="true"
            label={this.composeTweetText}
            class={styles.twitterTweetInput}
            placeholder="Come check out my stream"
            maxLength={280}
            maxHeight={140}
            slot="input"
          />
          <div class={styles.twitterButtons}>
            {this.primeButton(h)}
            <button
              class={cx('button', 'button--default', styles.adjustButton)}
              disabled={this.updatingInfo}
              onClick={this.unlinkTwitter}
            >
              {$t('Unlink Twitter')}
            </button>
          </div>
        </div>
      );
    }
  }

  render(h: Function) {
    if (!this.midStreamMode) {
      return <HFormGroup metadata={{}}>{this.twitter(h)}</HFormGroup>;
    }
  }
}
