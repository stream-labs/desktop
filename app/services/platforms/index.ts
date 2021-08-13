import { NiconicoService } from './niconico';

export type IStreamingSetting = {
  url: string;
  key: string;
  bitrate: number | undefined;
};

// All platform services should implement
// this interface.
export interface IPlatformService {
  authWindowOptions: Electron.BrowserWindowConstructorOptions;

  authUrl: string;

  setupStreamSettings: (programId: string) => Promise<IStreamingSetting>;

  isLoggedIn?: () => Promise<boolean>;
  logout?: () => Promise<void>;

  getUserPageURL?: () => string;
  isPremium?: (token: string) => Promise<boolean>;
}

export interface IPlatformAuth {
  apiToken: string; // N Air API Token
  platform: {
    type: TPlatform;
    username: string;
    token: string;
    id: string;
    channelId?: string;
    userIcon?: string;
    isPremium?: boolean;
  };
}

export type TPlatform = 'niconico';

export function getPlatformService(platform: TPlatform): IPlatformService {
  return {
    niconico: NiconicoService.instance,
  }[platform];
}
