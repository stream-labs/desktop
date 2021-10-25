import { Service } from 'services';
import { Inject } from 'services/core';
import { UserService } from 'services/user';
import { authorizedHeaders, jfetch } from 'util/requests';
import { HostsService } from './hosts';
import electron from 'electron';
import { UsageStatisticsService } from './usage-statistics';

interface ILoginTokenResponse {
  login_token: string;
  expires_at: number;
}

export class MagicLinkService extends Service {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;
  @Inject() usageStatisticsService: UsageStatisticsService;

  async getDashboardMagicLink(subPage = '', source?: string) {
    const token = (await this.fetchNewToken()).login_token;
    const sourceString = source ? `&refl=${source}` : '';
    return `https://${this.hostsService.streamlabs}/slobs/magic/dashboard?login_token=${token}&r=${
      subPage ?? ''
    }${sourceString}`;
  }

  private fetchNewToken(): Promise<ILoginTokenResponse> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(
      `https://${this.hostsService.streamlabs}/api/v5/slobs/login/token`,
      { headers },
    );

    return jfetch(request);
  }

  /**
   * open the prime onboarding in the browser
   * @param refl a referral tag for analytics
   */
  async linkToPrime(refl: string) {
    try {
      const link = await this.getDashboardMagicLink('prime', refl);
      electron.remote.shell.openExternal(link);
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }
  }

  async openWidgetThemesMagicLink() {
    try {
      const link = await this.getDashboardMagicLink('widgetthemes');
      electron.remote.shell.openExternal(link);
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }
  }

  async openDonationSettings() {
    try {
      const link = await this.getDashboardMagicLink('settings/donation-settings');
      electron.remote.shell.openExternal(link);
      this.usageStatisticsService.recordFeatureUsage('openDonationSettings');
    } catch (e: unknown) {
      console.error('Error generating dashboard magic link', e);
    }
  }

  // async openTipPageSettings() {
  //
  //   const token = (await this.fetchNewToken()).login_token;
  //   return `https://${this.hostsService.streamlabs}/slobs/magic/dashboard?login_token=${token}&r=${
  //     subPage ?? ''
  //   }`;
  //
  //   try {
  //     const link = await this.getDashboardMagicLink('settings/donation-settings');
  //     electron.remote.shell.openExternal(link);
  //     this.usageStatisticsService.recordFeatureUsage('openDonationSettings');
  //   } catch (e: unknown) {
  //     console.error('Error generating dashboard magic link', e);
  //   }
  // }
}
