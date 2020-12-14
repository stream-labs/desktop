import { ViewHandler } from '../core';
import { IGoLiveSettings, IStreamingServiceState, IStreamSettings } from './streaming-api';
import { StreamSettingsService } from '../settings/streaming';
import { UserService } from '../user';
import { RestreamService } from '../restream';
import { getPlatformService, TPlatform, TPlatformCapability } from '../platforms';
import { cloneDeep, difference } from 'lodash';

/**
 * The stream info view is responsible for keeping
 * reliable, up-to-date information about the user's
 * channel and current stream in the Vuex store for
 * components to make use of.
 */
export class StreamInfoView extends ViewHandler<IStreamingServiceState> {
  private get userView() {
    return this.getServiceViews(UserService);
  }

  private get restreamView() {
    return this.getServiceViews(RestreamService);
  }

  private get streamSettingsView() {
    return this.getServiceViews(StreamSettingsService);
  }

  get info() {
    return this.state.info;
  }

  /**
   * Returns a sorted list of all platforms (linked and unlinked)
   */
  get allPlatforms(): TPlatform[] {
    return this.sortPlatforms(['twitch', 'mixer', 'facebook', 'youtube']);
  }

  /**
   * Returns a list of linked platforms available for restream
   */
  get linkedPlatforms(): TPlatform[] {
    if (!this.userView.state.auth) return [];
    if (
      !this.restreamView.canEnableRestream ||
      !this.streamSettingsView.state.protectedModeEnabled
    ) {
      return [this.userView.auth!.primaryPlatform];
    }
    return this.allPlatforms.filter(p => this.isPlatformLinked(p));
  }

  /**
   * Returns a list of enabled for streaming platforms
   */
  get enabledPlatforms(): TPlatform[] {
    return this.getEnabledPlatforms(this.goLiveSettings);
  }

  /**
   * Returns a list of enabled for streaming platforms from the given settings object
   */
  getEnabledPlatforms(settings: IStreamSettings): TPlatform[] {
    return Object.keys(settings.platforms).filter(
      (platform: TPlatform) =>
        this.linkedPlatforms.includes(platform) && settings.platforms[platform].enabled,
    ) as TPlatform[];
  }

  get isMultiplatformMode(): boolean {
    return (
      this.streamSettingsView.state.protectedModeEnabled &&
      (this.enabledPlatforms.length > 1 ||
        this.goLiveSettings.customDestinations.filter(dest => dest.enabled).length > 0)
    );
  }

  get isMidStreamMode(): boolean {
    return this.state.streamingStatus !== 'offline';
  }

  /**
   * Returns total viewer count for all enabled platforms
   */
  get viewerCount(): number {
    if (!this.enabledPlatforms.length) return 0;
    return this.enabledPlatforms
      .map(platform => getPlatformService(platform).state.viewersCount)
      .reduce((c1, c2) => c1 + c2);
  }

  /**
   * Chat url of a primary platform
   */
  get chatUrl(): string {
    if (!this.userView.auth) return '';
    return getPlatformService(this.userView.auth.primaryPlatform).chatUrl;
  }

  /**
   * Prepares and returns the initial settings for the GoLive window
   */
  get goLiveSettings(): IGoLiveSettings {
    const destinations = {};
    this.linkedPlatforms.forEach(platform => {
      destinations[platform] = this.getPlatformSettings(platform);
    });

    const savedGoLiveSettings = this.streamSettingsView.state.goLiveSettings;

    return {
      platforms: destinations as IGoLiveSettings['platforms'],
      advancedMode: !!this.streamSettingsView.state.goLiveSettings?.advancedMode,
      optimizedProfile: undefined,
      customDestinations: savedGoLiveSettings?.customDestinations || [],
      tweetText: '',
    };
  }

  /**
   * Returns common fields for the stream such as title, description, game
   */
  getCommonFields(settings: IStreamSettings) {
    const commonFields = {
      title: '',
      description: '',
      game: '',
    };
    const destinations = Object.keys(settings.platforms) as TPlatform[];
    const enabledDestinations = destinations.filter(dest => settings.platforms[dest].enabled);
    const destinationsWithCommonSettings = enabledDestinations.filter(
      dest => !settings.platforms[dest].useCustomFields,
    );
    const destinationWithCustomSettings = difference(
      enabledDestinations,
      destinationsWithCommonSettings,
    );

    // search fields in platforms that don't use custom settings first
    destinationsWithCommonSettings.forEach(platform => {
      const destSettings = settings.platforms[platform];
      Object.keys(commonFields).forEach(fieldName => {
        if (commonFields[fieldName] || !destSettings[fieldName]) return;
        commonFields[fieldName] = destSettings[fieldName];
      });
    });

    // search fields in platforms that have custom fields
    destinationWithCustomSettings.forEach(platform => {
      const destSettings = settings.platforms[platform];
      Object.keys(commonFields).forEach(fieldName => {
        if (commonFields[fieldName] || !destSettings[fieldName]) return;
        commonFields[fieldName] = destSettings[fieldName];
      });
    });

    return commonFields;
  }

  /**
   * return common fields for the stream such title, description, game
   */
  get commonFields(): { title: string; description: string; game: string } {
    return this.getCommonFields(this.goLiveSettings);
  }

  /**
   * Sort the platform list
   * - the primary platform is always first
   * - linked platforms are always on the top of the list
   * - the rest has an alphabetic sort
   */
  sortPlatforms(platforms: TPlatform[]): TPlatform[] {
    platforms = platforms.sort();
    return [
      ...platforms.filter(p => this.isPrimaryPlatform(p)),
      ...platforms.filter(p => !this.isPrimaryPlatform(p) && this.isPlatformLinked(p)),
      ...platforms.filter(p => !this.isPlatformLinked(p)),
    ];
  }

  /**
   * returns `true` if all target platforms have prepopulated their settings
   */
  isPrepopulated(platforms: TPlatform[]): boolean {
    for (const platform of platforms) {
      if (!getPlatformService(platform).state.isPrepopulated) return false;
    }
    return true;
  }

  /**
   * Returns true if given platforms have a capability
   */
  supports(capability: TPlatformCapability, targetPlatforms?: TPlatform[]): boolean {
    const platforms = targetPlatforms || this.enabledPlatforms;
    for (const platform of platforms) {
      if (getPlatformService(platform).capabilities.has(capability)) return true;
    }
    return false;
  }

  isPlatformLinked(platform: TPlatform): boolean {
    if (!this.userView.auth?.platforms) return false;
    return !!this.userView.auth?.platforms[platform];
  }

  isPrimaryPlatform(platform: TPlatform) {
    return platform === this.userView.auth?.primaryPlatform;
  }

  /**
   * Validates settings and returns an error string
   */
  validateSettings<T extends IStreamSettings>(settings: T): string {
    return '';
  }

  /**
   * Return true if one of the checks has been failed
   */
  hasFailedChecks(): boolean {
    return !!Object.keys(this.state.info.checklist).find(
      check => this.state.info.checklist[check] === 'failed',
    );
  }

  /**
   * Returns Go-Live settings for a given platform
   */
  private getPlatformSettings(platform: TPlatform) {
    const service = getPlatformService(platform);
    const savedDestinations = this.streamSettingsView.state.goLiveSettings?.platforms;
    const { enabled, useCustomFields } = (savedDestinations && savedDestinations[platform]) || {
      enabled: false,
      useCustomFields: false,
    };
    const settings = cloneDeep(service.state.settings);

    // don't reuse broadcastId for Youtube
    if (settings && settings['broadcastId']) settings['broadcastId'] = '';

    // don't reuse liveVideoId for Facebook
    if (platform === 'facebook' && settings && settings['liveVideoId']) {
      settings['liveVideoId'] = '';
    }

    return {
      ...settings,
      useCustomFields,
      enabled: enabled || this.isPrimaryPlatform(platform),
    };
  }
}
