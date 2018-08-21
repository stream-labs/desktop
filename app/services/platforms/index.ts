import { NiconicoService } from './niconico';

export type IStreamingSetting = {
  asking: boolean,
  url: string,
  key: string
}

// All platform services should implement
// this interface.
export interface IPlatformService {

  authWindowOptions: Electron.BrowserWindowConstructorOptions;

  authUrl: string;

  setupStreamSettings: (programId: string) => Promise<IStreamingSetting>;

  fetchViewerCount: () => Promise<number>;

  getChatUrl: (mode: string) => Promise<string>;

  isLoggedIn?: () => Promise<boolean>;
  logout?: () => Promise<void>;

  getUserPageURL?: () => string;
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
  };
}

export type TPlatform = 'niconico';

export function getPlatformService(platform: TPlatform): IPlatformService {
  return {
    niconico: NiconicoService.instance
  }[platform];
}
