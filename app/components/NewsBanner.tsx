import Vue from 'vue';
import { shell } from 'electron';
import { AnnouncementsService } from 'services/announcements';
import { Inject } from 'services/core/injector';
import { Component, Watch } from 'vue-property-decorator';
import { NavigationService, TAppPage } from 'services/navigation';
import { $t } from 'services/i18n';
import cx from 'classnames';
import styles from './NewsBanner.m.less';
import { CustomizationService } from 'services/customization';
import { WindowsService } from 'services/windows';
import { SettingsService } from 'services/settings';

@Component({})
export default class NewsBanner extends Vue {
  @Inject() announcementsService: AnnouncementsService;
  @Inject() navigationService: NavigationService;
  @Inject() customizationService: CustomizationService;
  @Inject() windowsService: WindowsService;
  @Inject() settingsService: SettingsService;

  processingClose = false;

  get currentBanner() {
    return this.announcementsService.state;
  }

  get bannerExists() {
    return this.announcementsService.bannerExists;
  }

  @Watch('bannerExists')
  toggleAnimation() {
    this.windowsService.updateStyleBlockers('main', true);
    window.setTimeout(() => {
      this.windowsService.updateStyleBlockers('main', false);
    }, 500);
  }

  get headerText() {
    return this.currentBanner.header;
  }

  async closeBanner(e?: Event, clickType: 'action' | 'dismissal' = 'dismissal') {
    if (e) e.stopPropagation();
    this.processingClose = true;
    await this.announcementsService.closeBanner(clickType);
    this.processingClose = false;
  }

  followLink() {
    if (!this.currentBanner) return;
    if (this.currentBanner.linkTarget === 'slobs') {
      // This isn't actually a page, but we want to be able to open it from a banner
      if (this.currentBanner.link === 'Settings') {
        this.settingsService.showSettings(this.currentBanner.params.category);
      } else {
        this.navigationService.navigate(
          this.currentBanner.link as TAppPage,
          this.currentBanner.params,
        );
      }
    } else {
      shell.openExternal(this.currentBanner.link);
    }
    if (this.currentBanner.closeOnLink) {
      this.closeBanner(null, 'action');
    }
  }

  render() {
    return (
      <div>
        <div
          class={cx({ [styles.banner]: true, [styles.show]: this.bannerExists })}
          onClick={this.followLink}
        >
          <div class={styles.leftBlock} />
          <div class={styles.rightBlock} />
          <img class={styles.mainImage} src={this.currentBanner.thumbnail} />
          <div class={styles.titleContainer}>
            <h3 class={styles.title}>{this.headerText}</h3>
            <span class={styles.subheading}>{this.currentBanner.subHeader}</span>
          </div>
          <div class={styles.ctaContainer}>
            <button class={cx('button', styles.learnMore)} disabled={!this.bannerExists}>
              {this.currentBanner.linkTitle}
            </button>
            <button
              class={styles.dismissButton}
              onClick={this.closeBanner}
              disabled={!this.bannerExists || this.processingClose}
            >
              {$t('Dismiss')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
