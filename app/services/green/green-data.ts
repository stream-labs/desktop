import { $t } from 'services/i18n';
import { EPlatform, TPlatform } from 'services/platforms';

export enum EOutputDisplayType {
  Horizontal = 'horizontal',
  Green = 'green',
}

export type TGreenDisplayType = EOutputDisplayType.Horizontal | EOutputDisplayType.Green;

export interface IGreenPlatformSetting {
  platform: TPlatform;
  display: EOutputDisplayType;
}

export type TGreenPlatformSettings = {
  [Platform in EPlatform]: IGreenPlatformSetting;
};

export type TDisplayPlatforms = {
  [Display in EOutputDisplayType]: TPlatform[];
};

export const GreenPlatformSettings: TGreenPlatformSettings = {
  [EPlatform.Twitch]: {
    platform: EPlatform.Twitch,
    display: EOutputDisplayType.Horizontal,
  },
  [EPlatform.Facebook]: {
    platform: EPlatform.Facebook,
    display: EOutputDisplayType.Horizontal,
  },
  [EPlatform.YouTube]: {
    platform: EPlatform.YouTube,
    display: EOutputDisplayType.Horizontal,
  },
  [EPlatform.Trovo]: {
    platform: EPlatform.Trovo,
    display: EOutputDisplayType.Horizontal,
  },
  [EPlatform.Tiktok]: {
    platform: EPlatform.Tiktok,
    display: EOutputDisplayType.Green,
  },
};

export const platformLabels = (platform: EPlatform | string) =>
  ({
    [EPlatform.Twitch]: $t('Twitch'),
    [EPlatform.Facebook]: $t('Facebook'),
    [EPlatform.YouTube]: $t('YouTube'),
    [EPlatform.Trovo]: $t('Trovo'),
  }[platform]);

export const displayLabels = (display: EOutputDisplayType | string) =>
  ({
    [EOutputDisplayType.Horizontal]: $t('Horizontal'),
    [EOutputDisplayType.Green]: $t('Green'),
  }[display]);
