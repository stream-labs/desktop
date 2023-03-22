import { $t } from 'services/i18n';
import { TPlatform } from 'services/platforms';

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
  [Platform in TPlatform]: IGreenPlatformSetting;
};

export type TDisplayPlatforms = {
  [Display in EOutputDisplayType]: TPlatform[];
};

export const GreenPlatformSettings: TGreenPlatformSettings = {
  ['twitch']: {
    platform: 'twitch',
    display: EOutputDisplayType.Horizontal,
  },
  ['facebook']: {
    platform: 'facebook',
    display: EOutputDisplayType.Horizontal,
  },
  ['youtube']: {
    platform: 'youtube',
    display: EOutputDisplayType.Horizontal,
  },
  ['trovo']: {
    platform: 'trovo',
    display: EOutputDisplayType.Horizontal,
  },
  ['tiktok']: {
    platform: 'tiktok',
    display: EOutputDisplayType.Green,
  },
};

export const platformLabels = (platform: TPlatform | string) =>
  ({
    ['twitch']: $t('Twitch'),
    ['facebook']: $t('Facebook'),
    ['youtube']: $t('YouTube'),
    ['trovo']: $t('Trovo'),
  }[platform]);

export const displayLabels = (display: EOutputDisplayType | string) =>
  ({
    [EOutputDisplayType.Horizontal]: $t('Horizontal'),
    [EOutputDisplayType.Green]: $t('Green'),
  }[display]);
