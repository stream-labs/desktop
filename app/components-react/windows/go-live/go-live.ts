import { IGoLiveSettings } from '../../../services/streaming';
import { TPlatform } from '../../../services/platforms';

export interface IGoLiveProps {
  settings: IGoLiveSettings;
  setSettings: (newSettings: IGoLiveSettings) => unknown;
}

export function getEnabledPlatforms(props: IGoLiveProps): TPlatform[] {
  const platforms = Object.keys(props.settings.platforms) as TPlatform[];
  return platforms.filter(platform => props.settings.platforms[platform].enabled);
}
