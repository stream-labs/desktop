import { $t } from 'services/i18n';
import { TPlatform, EPlatform } from 'services/platforms';
import { TDisplayType } from 'services/settings-v2';

export enum EOutputDisplayType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}
export interface IDualOutputPlatformSetting {
  platform: TPlatform;
  display: EOutputDisplayType;
}

export interface IDualOutputDestinationSetting {
  destination: string;
  display: TDisplayType;
}

export type TDualOutputPlatformSettings = {
  [Platform in EPlatform]: IDualOutputPlatformSetting;
};

export type TDisplayPlatforms = {
  [Display in EOutputDisplayType]: TPlatform[];
};

export type TDisplayDestinations = {
  [Display in EOutputDisplayType]: string[];
};

export const DualOutputPlatformSettings: TDualOutputPlatformSettings = {
  [EPlatform.Twitch]: {
    platform: EPlatform.Twitch,
    display: EOutputDisplayType.Horizontal,
  },
  [EPlatform.YouTube]: {
    platform: EPlatform.YouTube,
    display: EOutputDisplayType.Horizontal,
  },
  [EPlatform.Facebook]: {
    platform: EPlatform.Facebook,
    display: EOutputDisplayType.Horizontal,
  },
  [EPlatform.TikTok]: {
    platform: EPlatform.TikTok,
    display: EOutputDisplayType.Vertical,
  },
  [EPlatform.Trovo]: {
    platform: EPlatform.Trovo,
    display: EOutputDisplayType.Horizontal,
  },
  [EPlatform.Twitter]: {
    platform: EPlatform.Twitter,
    display: EOutputDisplayType.Horizontal,
  },
  [EPlatform.Instagram]: {
    platform: EPlatform.Instagram,
    display: EOutputDisplayType.Vertical,
  },
};
