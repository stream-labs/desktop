import { Component, Prop } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import electron from 'electron';
import { OnboardingStep } from 'streamlabs-beaker';
import { UsageStatisticsService } from 'services/usage-statistics';
import { OnboardingService } from 'services/onboarding';
import { Inject } from 'services';
import { getPlatformService } from 'services/platforms';
import { FacebookService } from 'services/platforms/facebook';
import { $t } from 'services/i18n';

@Component({})
export default class FacebookPageCreation extends TsxComponent<{ continue: Function }> {
  @Inject() onboardingService: OnboardingService;
  @Inject() usageStatisticsService: UsageStatisticsService;

  @Prop() continue: Function;

  pageCount: number = null;
  loading = true;

  mounted() {
    this.getPageCount().then(count => {
      this.pageCount = count;
      this.loading = false;
    });
  }

  openPageCreation() {
    this.usageStatisticsService.recordAnalyticsEvent('FacebookLogin', { action: 'page_creation' });
    electron.remote.shell.openExternal(
      'https://www.facebook.com/gaming/pages/create?ref=streamlabs',
    );
    this.continue();
  }

  openStreamerDashboard() {
    this.usageStatisticsService.recordAnalyticsEvent('FacebookLogin', {
      action: 'streamer_dashboard',
    });
    electron.remote.shell.openExternal('https://fb.gg/streamer?ref=streamlabs');
    this.continue();
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
      <OnboardingStep>
        <div slot="title">{$t('Facebook Setup')}</div>
        <div slot="desc">{this.description}</div>
        <button class="button button--action button--lg" onClick={this.buttonAction}>
          {this.buttonText}
        </button>
      </OnboardingStep>
    );
  }
}
