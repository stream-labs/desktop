import { Service } from 'services';
import { Inject } from 'services/core';
import { UserService } from 'services/user';
import { authorizedHeaders, handleResponse } from 'util/requests';
import { HostsService } from './hosts';

interface ILoginTokenResponse {
  login_token: string;
  expires_at: number;
}

export class MagicLinkService extends Service {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;

  async getDashboardMagicLink() {
    const token = await this.getCurrentToken();

    return `https://${this.hostsService.streamlabs}/slobs/magic/dashboard?login_token=${token}`;
  }

  private async getCurrentToken() {
    if (!this.currentToken || this.isTokenExpired()) {
      const tokenInfo = await this.fetchNewToken();

      if (tokenInfo) {
        this.currentToken = tokenInfo.login_token;
        this.currentExpiration = tokenInfo.expires_at;
      }
    }

    return this.currentToken;
  }

  private isTokenExpired() {
    // This service always hands out tokens with at least 1 hour
    // of validity.
    const oneHourFromNow = Math.floor(Date.now() / 1000) + 60 * 60;

    return this.currentExpiration < oneHourFromNow;
  }

  private currentToken: string;
  private currentExpiration: number;

  private fetchNewToken(): Promise<ILoginTokenResponse> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(
      `https://${this.hostsService.streamlabs}/api/v5/slobs/login/token`,
      { headers },
    );

    return fetch(request).then(handleResponse);
  }
}
