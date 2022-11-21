import { $t } from 'services/i18n';

export enum EDualOutputPlatform {
  Twitch = 'twitch',
  Facebook = 'facebook',
  YouTube = 'youtube',
  Trovo = 'trovo',
}

export enum TOutputDisplayType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export interface IDualOutputPlatformSetting {
  platform: string;
  setting: TOutputDisplayType;
}

export type TDualOutputPlatformSettings = {
  [Platform in EDualOutputPlatform]: IDualOutputPlatformSetting;
};

export const DualOutputPlatformSettings: TDualOutputPlatformSettings = {
  [EDualOutputPlatform.Twitch]: {
    platform: EDualOutputPlatform.Twitch,
    setting: TOutputDisplayType.Horizontal,
  },
  [EDualOutputPlatform.Facebook]: {
    platform: EDualOutputPlatform.Facebook,
    setting: TOutputDisplayType.Horizontal,
  },
  [EDualOutputPlatform.YouTube]: {
    platform: EDualOutputPlatform.YouTube,
    setting: TOutputDisplayType.Horizontal,
  },
  [EDualOutputPlatform.Trovo]: {
    platform: EDualOutputPlatform.Trovo,
    setting: TOutputDisplayType.Horizontal,
  },
};

export const platformLabels = (platform: EDualOutputPlatform | string) =>
  ({
    [EDualOutputPlatform.Twitch]: $t('Twitch'),
    [EDualOutputPlatform.Facebook]: $t('Facebook'),
    [EDualOutputPlatform.YouTube]: $t('YouTube'),
    [EDualOutputPlatform.Trovo]: $t('Trovo'),
  }[platform]);

export const displayLabels = (display: TOutputDisplayType | string) =>
  ({
    [TOutputDisplayType.Horizontal]: $t('Horizontal'),
    [TOutputDisplayType.Vertical]: $t('Vertical'),
  }[display]);
