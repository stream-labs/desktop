import { IGoLiveSettings } from '../../../services/streaming';
import { TPlatform } from '../../../services/platforms';

export interface IGoLiveProps {
  settings: IGoLiveSettings;
  setSettings: (newSettings: IGoLiveSettings) => unknown;
}

// TODO: remove
export type TSetPlatformSettingsFn = <T extends TPlatform>(
  platform: T,
  newPlatformSettings: IGoLiveSettings['platforms'][T],
) => unknown;

export type TUpdatePlatformSettingsFn = <T extends TPlatform>(
  platform: T,
  patch: Partial<IGoLiveSettings['platforms'][T]>,
) => unknown;

export function getEnabledPlatforms(settings: IGoLiveSettings): TPlatform[] {
  const platforms = Object.keys(settings.platforms) as TPlatform[];
  return platforms.filter(platform => settings.platforms[platform].enabled);
}

// /**
//  * Returns true if the component should show only required fields
//  */
// export function canShowOnlyRequiredFields(settings: IGoLiveSettings): boolean {
//   const enabledPlatforms = getEnabledPlatforms(settings);
//   return enabledPlatforms.length > 1 && !settings.advancedMode;
// }

// export function (settings: IGoLiveSettings): boolean {
//   const enabledPlatforms = getEnabledPlatforms(settings);
//   return enabledPlatforms.length > 1 && !settings.advancedMode;
// }

export function isAdvancedMode(settings: IGoLiveSettings): boolean {
  const enabledPlatforms = getEnabledPlatforms(settings);
  return enabledPlatforms.length == 1 || settings.advancedMode;
}

