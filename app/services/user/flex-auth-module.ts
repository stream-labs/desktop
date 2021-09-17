import { TPlatform, IUserAuth } from 'services/platforms';

export class FlexAuthModule {
  parseAuthFromUrl(token: string): IUserAuth {
    return {
      widgetToken: token,
      apiToken: token,
      primaryPlatform: 'flextv' as TPlatform,
      platforms: {},
      hasRelogged: true,
    };
  }
}
