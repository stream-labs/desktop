import { Service } from 'services';
import { Inject } from 'services/core';
import { UserService } from 'services/user';
import { authorizedHeaders, handleResponse } from 'util/requests';
import { HostsService } from './hosts';
import electron from 'electron';

interface ILoginTokenResponse {
  login_token: string;
  expires_at: number;
}

export class MagicLinkService extends Service {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;

  async getDashboardMagicLink(subPage = '') {
    const token = (await this.fetchNewToken()).login_token;

    return `https://${
      this.hostsService.streamlabs
    }/slobs/magic/dashboard?login_token=${token}&r=${subPage}`;
  }

  private fetchNewToken(): Promise<ILoginTokenResponse> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(
      `https://${this.hostsService.streamlabs}/api/v5/slobs/login/token`,
      { headers },
    );

    return fetch(request).then(handleResponse);
  }

  async openWidgetThemesMagicLink() {
    try {
      const link = await this.getDashboardMagicLink('widgetthemes');
      electron.remote.shell.openExternal(link);
    } catch (e) {
      console.error('Error generating dashboard magic link', e);
    }
  }
}
