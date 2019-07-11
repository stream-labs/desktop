import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import electron from 'electron';
import { UsageStatisticsService } from 'services/usage-statistics';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services';
import { getPlatformService } from 'services/platforms';
import { FacebookService } from 'services/platforms/facebook';
import { $t } from 'services/i18n';
import { IncrementalRolloutService, EAvailableFeatures } from 'services/incremental-rollout';

@Component({})
export default class FacebookPageCreation extends TsxComponent<{}> {
  @Inject() onboardingService: OnboardingService;
  @Inject() usageStatisticsService: UsageStatisticsService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;

  pageCount: number = null;
  loading = true;

  mounted() {
    // This will do a second unnecessary fetch, but it's the only
    // way to be sure we have fetched features
    this.incrementalRolloutService
      .fetchAvailableFeatures()
      .then(() => {
        if (
          this.incrementalRolloutService.featureIsEnabled(EAvailableFeatures.facebookOnboarding)
        ) {
          this.getPageCount().then(count => {
            this.pageCount = count;
            this.loading = false;
          });
        } else {
          this.onboardingService.skip();
        }
      })
      .catch(() => this.onboardingService.skip());
  }

  openPageCreation() {
    this.usageStatisticsService.recordAnalyticsEvent('FacebookLogin', { action: 'page_creation' });
    electron.remote.shell.openExternal(
      'https://www.facebook.com/gaming/pages/create?ref=streamlabs',
    );
    this.onboardingService.next();
  }

  openStreamerDashboard() {
    this.usageStatisticsService.recordAnalyticsEvent('FacebookLogin', {
      action: 'streamer_dashboard',
    });
    electron.remote.shell.openExternal('https://fb.gg/streamer?ref=streamlabs');
    this.onboardingService.next();
  }

  skip() {
    this.usageStatisticsService.recordAnalyticsEvent('FacebookLogin', { action: 'skip' });
    this.onboardingService.skip();
  }

  async getPageCount(): Promise<number> {
    const service = getPlatformService('facebook');
    if (!(service instanceof FacebookService)) return;

    let pages: { data: any[] };

    try {
      pages = await service.fetchRawPageResponse();
    } catch (e) {
      console.error('Error fetching facebook page count', e);
      return 0;
    }
    return pages.data.length;
  }

  get description() {
    return this.pageCount
      ? $t('You can access your Facebook Streamer Dashboard here.')
      : $t('You need a Facebook page to stream to Facebook. You can create one now.');
  }

  get buttonText() {
    return this.pageCount ? $t('Streamer Dashboard') : $t('Create a Page');
  }

  get buttonAction() {
    return this.pageCount ? () => this.openStreamerDashboard() : () => this.openPageCreation();
  }

  render(h: Function) {
    if (this.loading) {
      return <i class="fa fa-spinner fa-pulse" />;
    }

    return (
      <div class="onboarding-step">
        <div class="onboarding-title">Facebook Setup</div>
        <div class="onboarding-desc">{this.description}</div>
        <button class="button button--action button--lg" onClick={this.buttonAction}>
          {this.buttonText}
        </button>
        <div class="setup-later">
          <a onClick={() => this.skip()}>{$t('Skip')}</a>
        </div>
      </div>
    );
  }
}
