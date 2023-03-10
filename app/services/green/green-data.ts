import { $t } from 'services/i18n';
import { TPlatform } from 'services/platforms';

export enum EGreenPlatform {
  Twitch = 'twitch',
  Facebook = 'facebook',
  YouTube = 'youtube',
  Trovo = 'trovo',
}

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
  [Platform in EGreenPlatform]: IGreenPlatformSetting;
};

export type TDisplayPlatforms = {
  [Display in EOutputDisplayType]: TPlatform[];
};

export const GreenPlatformSettings: TGreenPlatformSettings = {
  [EGreenPlatform.Twitch]: {
    platform: EGreenPlatform.Twitch,
    display: EOutputDisplayType.Horizontal,
  },
  [EGreenPlatform.Facebook]: {
    platform: EGreenPlatform.Facebook,
    display: EOutputDisplayType.Horizontal,
  },
  [EGreenPlatform.YouTube]: {
    platform: EGreenPlatform.YouTube,
    display: EOutputDisplayType.Horizontal,
  },
  [EGreenPlatform.Trovo]: {
    platform: EGreenPlatform.Trovo,
    display: EOutputDisplayType.Horizontal,
  },
};

export const platformLabels = (platform: EGreenPlatform | string) =>
  ({
    [EGreenPlatform.Twitch]: $t('Twitch'),
    [EGreenPlatform.Facebook]: $t('Facebook'),
    [EGreenPlatform.YouTube]: $t('YouTube'),
    [EGreenPlatform.Trovo]: $t('Trovo'),
  }[platform]);

export const displayLabels = (display: EOutputDisplayType | string) =>
  ({
    [EOutputDisplayType.Horizontal]: $t('Horizontal'),
    [EOutputDisplayType.Green]: $t('Green'),
  }[display]);
