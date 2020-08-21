import TsxComponent from 'components/tsx-component';
import { TPlatform } from 'services/platforms';
import { IStreamSettings } from 'services/streaming';

/**
 * A base component for editing the stream settings for a specific platform
 */
export default abstract class BaseEditStreamInfo<Props> extends TsxComponent<Props> {
  protected abstract settings: IStreamSettings;

  get enabledPlatforms(): TPlatform[] {
    const platforms = Object.keys(this.settings.platforms) as TPlatform[];
    return platforms.filter(platform => this.settings.platforms[platform].enabled);
  }

  /**
   * Returns true if component should show only required fields
   */
  get canShowOnlyRequiredFields(): boolean {
    return this.enabledPlatforms.length > 1 && !this.settings.advancedMode;
  }
}
