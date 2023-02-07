import { $t } from 'services/i18n';
import { TPlatform } from 'services/platforms';

export enum EDualOutputPlatform {
  Twitch = 'twitch',
  Facebook = 'facebook',
  YouTube = 'youtube',
  Trovo = 'trovo',
}

export enum EOutputDisplayType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export type TDualOutputDisplayType = EOutputDisplayType.Horizontal | EOutputDisplayType.Vertical;

export interface IDualOutputPlatformSetting {
  platform: TPlatform;
  display: EOutputDisplayType;
}

export type TDualOutputPlatformSettings = {
  [Platform in EDualOutputPlatform]: IDualOutputPlatformSetting;
};

export type TDisplayPlatforms = {
  [Display in EOutputDisplayType]: TPlatform[];
};

export const DualOutputPlatformSettings: TDualOutputPlatformSettings = {
  [EDualOutputPlatform.Twitch]: {
    platform: EDualOutputPlatform.Twitch,
    display: EOutputDisplayType.Horizontal,
  },
  [EDualOutputPlatform.Facebook]: {
    platform: EDualOutputPlatform.Facebook,
    display: EOutputDisplayType.Horizontal,
  },
  [EDualOutputPlatform.YouTube]: {
    platform: EDualOutputPlatform.YouTube,
    display: EOutputDisplayType.Horizontal,
  },
  [EDualOutputPlatform.Trovo]: {
    platform: EDualOutputPlatform.Trovo,
    display: EOutputDisplayType.Horizontal,
  },
};

export const platformLabels = (platform: EDualOutputPlatform | string) =>
  ({
    [EDualOutputPlatform.Twitch]: $t('Twitch'),
    [EDualOutputPlatform.Facebook]: $t('Facebook'),
    [EDualOutputPlatform.YouTube]: $t('YouTube'),
    [EDualOutputPlatform.Trovo]: $t('Trovo'),
  }[platform]);

export const displayLabels = (display: EOutputDisplayType | string) =>
  ({
    [EOutputDisplayType.Horizontal]: $t('Horizontal'),
    [EOutputDisplayType.Vertical]: $t('Vertical'),
  }[display]);
