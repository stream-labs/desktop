import { $t } from 'services/i18n';
import { TPlatform, EPlatform } from 'services/platforms';
import { TDisplayType } from 'services/settings-v2';

export enum EOutputDisplayType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export type TDualOutputDisplayType = EOutputDisplayType.Horizontal | EOutputDisplayType.Vertical;

export interface IDualOutputPlatformSetting {
  platform: TPlatform;
  display: EOutputDisplayType;
  canUpdate: boolean;
}

export interface IDualOutputDestinationSetting {
  destination: string;
  display: TDisplayType;
  canUpdate: boolean;
}

export type TDualOutputPlatformSettings = {
  [Platform in EPlatform]: IDualOutputPlatformSetting;
};

export type TDisplayPlatforms = {
  [Display in EOutputDisplayType]: TPlatform[];
};

export const DualOutputPlatformSettings: TDualOutputPlatformSettings = {
  [EPlatform.Twitch]: {
    platform: EPlatform.Twitch,
    display: EOutputDisplayType.Horizontal,
    canUpdate: true,
  },
  [EPlatform.YouTube]: {
    platform: EPlatform.YouTube,
    display: EOutputDisplayType.Horizontal,
    canUpdate: true,
  },
  [EPlatform.Facebook]: {
    platform: EPlatform.Facebook,
    display: EOutputDisplayType.Horizontal,
    canUpdate: true,
  },
  [EPlatform.TikTok]: {
    platform: EPlatform.TikTok,
    display: EOutputDisplayType.Vertical,
    canUpdate: false,
  },
  [EPlatform.Trovo]: {
    platform: EPlatform.Trovo,
    display: EOutputDisplayType.Horizontal,
    canUpdate: true,
  },
};

export const displayLabels = (display: EOutputDisplayType | string) =>
  ({
    [EOutputDisplayType.Horizontal]: $t('Horizontal'),
    [EOutputDisplayType.Vertical]: $t('Vertical'),
  }[display]);
