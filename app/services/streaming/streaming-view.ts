import { ViewHandler } from '../core';
import {
  IGoLiveSettings,
  IStreamSettings,
  EStreamingState,
  ERecordingState,
  EReplayBufferState,
} from './streaming-api';
import { StreamSettingsService, ICustomStreamDestination } from '../settings/streaming';
import { UserService } from '../user';
import { RestreamService, TOutputOrientation } from '../restream';
import {
  DualOutputService,
  TDisplayPlatforms,
  IDualOutputPlatformSetting,
  TDisplayDestinations,
} from '../dual-output';
import { getPlatformService, TPlatform, TPlatformCapability, platformList } from '../platforms';
import { TwitterService } from '../../app-services';
import cloneDeep from 'lodash/cloneDeep';
import difference from 'lodash/difference';
import { Services } from '../../components-react/service-provider';
import { getDefined } from '../../util/properties-type-guards';
import { TDisplayType } from 'services/settings-v2';
import compact from 'lodash/compact';

/**
 * The stream info view is responsible for keeping
 * reliable, up-to-date information about the user's
 * channel and current stream in the Vuex store for
 * components to make use of.
 */
export class StreamInfoView<T extends Object> extends ViewHandler<T> {
  get settings(): IGoLiveSettings {
    return this.savedSettings;
  }

  private get userView() {
    return this.getServiceViews(UserService);
  }

  private get restreamView() {
    return this.getServiceViews(RestreamService);
  }

  private get streamSettingsView() {
    return this.getServiceViews(StreamSettingsService);
  }

  private get twitterView() {
    return this.getServiceViews(TwitterService);
  }

  private get dualOutputView() {
    return this.getServiceViews(DualOutputService);
  }

  private get streamingState() {
    return Services.StreamingService.state;
  }

  get streamingStatus() {
    return this.streamingState.streamingStatus;
  }

  get info() {
    return this.streamingState.info;
  }

  get error() {
    return this.info.error;
  }

  get lifecycle() {
    return this.info.lifecycle;
  }

  get customDestinations() {
    return this.settings.customDestinations || [];
  }

  get platforms() {
    return this.settings.platforms;
  }

  get checklist() {
    return this.info.checklist;
  }

  get game() {
    return (
      (this.platforms.twitch?.enabled && this.platforms.twitch.game) ||
      (this.platforms.facebook?.enabled && this.platforms.facebook.game) ||
      (this.platforms.trovo?.enabled && this.platforms.trovo.game) ||
      ''
    );
  }

  getPlatformDisplayName(platform: TPlatform): string {
    return getPlatformService(platform).displayName;
  }

  // REMOVE
  get warning(): string {
    return this.info.warning;
  }

  /**
   * Returns a sorted list of all platforms (linked and unlinked)
   */
  get allPlatforms(): TPlatform[] {
    return this.getSortedPlatforms(platformList);
  }

  /**
   * Returns a list of linked platforms available
   */
  get linkedPlatforms(): TPlatform[] {
    if (!this.userView.state.auth) return [];

    return this.allPlatforms.filter(p => this.isPlatformLinked(p));
  }

  get protectedModeEnabled() {
    return this.streamSettingsView.state.protectedModeEnabled;
  }

  /**
   * Returns a list of enabled for streaming platforms
   */
  get enabledPlatforms(): TPlatform[] {
    return this.getEnabledPlatforms(this.settings.platforms);
  }

  /**
   * Returns the host from the rtmp url
   */
  get enabledCustomDestinationHosts() {
    return (
      this.settings.customDestinations
        .filter(dest => dest.enabled)
        // FIXME: index, but also split is a function?
        // @ts-ignore
        .map(dest => dest.url.split[2]) || []
    );
  }

  /**
   * Returns a list of enabled platforms with useCustomFields==false
   */
  get platformsWithoutCustomFields(): TPlatform[] {
    return this.enabledPlatforms.filter(platform => !this.platforms[platform]!.useCustomFields);
  }

  checkEnabled(platform: TPlatform) {
    return this.enabledPlatforms.includes(platform);
  }

  /**
   * Returns a list of enabled for streaming platforms from the given settings object
   */
  getEnabledPlatforms(platforms: IStreamSettings['platforms']): TPlatform[] {
    return Object.keys(platforms).filter(
      (platform: TPlatform) =>
        this.linkedPlatforms.includes(platform) && platforms[platform]?.enabled,
    ) as TPlatform[];
  }

  /**
   * Returns if the user can or should use the restream service
   */
  get isMultiplatformMode(): boolean {
    if (this.isDualOutputMode) return false;
    return (
      this.protectedModeEnabled &&
      (this.enabledPlatforms.length > 1 ||
        this.settings.customDestinations.filter(dest => dest.enabled).length > 0)
    );
  }

  /**
   * Returns if dual output mode is on. Dual output mode is only available to logged in users
   */
  get isDualOutputMode(): boolean {
    return this.dualOutputView.dualOutputMode && this.userView.isLoggedIn;
  }

  get shouldMultistreamDisplay(): { horizontal: boolean; vertical: boolean } {
    const numHorizontal =
      this.activeDisplayPlatforms.horizontal.length +
      this.activeDisplayDestinations.horizontal.length;
    const numVertical =
      this.activeDisplayPlatforms.vertical.length + this.activeDisplayDestinations.vertical.length;

    return {
      horizontal: numHorizontal > 1,
      vertical: numVertical > 1,
    };
  }

  /**
   * Returns the enabled platforms according to their assigned display
   */
  get activeDisplayPlatforms(): TDisplayPlatforms {
    const enabledPlatforms = this.enabledPlatforms;

    return Object.entries(this.dualOutputView.platformSettings).reduce(
      (displayPlatforms: TDisplayPlatforms, [key, val]: [string, IDualOutputPlatformSetting]) => {
        if (val && enabledPlatforms.includes(val.platform)) {
          displayPlatforms[val.display].push(val.platform);
        }
        return displayPlatforms;
      },
      { horizontal: [], vertical: [] },
    );
  }

  /**
   * Returns the enabled destinations according to their assigned display
   */
  get activeDisplayDestinations(): TDisplayDestinations {
    const destinations = this.customDestinations;

    return destinations.reduce(
      (displayDestinations: TDisplayDestinations, destination: ICustomStreamDestination) => {
        if (destination.enabled) {
          displayDestinations[destination.display ?? 'horizontal'].push(destination.url);
        }
        return displayDestinations;
      },
      { horizontal: [], vertical: [] },
    );
  }

  /**
   * Returns the display for a given platform
   */
  getPlatformDisplay(platform: TPlatform) {
    return this.dualOutputView.getPlatformDisplay(platform);
  }

  get isMidStreamMode(): boolean {
    return this.streamingState.streamingStatus !== 'offline';
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
   * If the primary platform is not enabled, and we're on single stream mode,
   * returns the URL of the first enabled platform
   */
  get chatUrl(): string {
    if (!this.userView.isLoggedIn || !this.userView.auth) return '';

    const enabledPlatforms = this.enabledPlatforms;
    const platform = this.enabledPlatforms.includes(this.userView.auth.primaryPlatform)
      ? this.userView.auth.primaryPlatform
      : enabledPlatforms[0];

    if (platform) {
      return getPlatformService(platform).chatUrl;
    }

    return '';
  }

  getTweetText(streamTitle: string) {
    return `${streamTitle} ${this.twitterView.url}`;
  }

  /**
   * Prepares and returns the initial settings for the GoLive window
   */
  get savedSettings(): IGoLiveSettings {
    const destinations = {} as IGoLiveSettings['platforms'];
    this.linkedPlatforms.forEach(platform => {
      // TODO: index
      // @ts-ignore
      destinations[platform as string] = this.getSavedPlatformSettings(platform);
    });

    // if user recently added a new platform then it doesn't have default title and description
    // so set the title and description from other platforms
    const platforms = this.applyCommonFields(destinations);

    const savedGoLiveSettings = this.streamSettingsView.state.goLiveSettings;

    /*
     * TODO: this should be done as a migration, if needed, but having it
     * here seems to ensure we always have a primary platform, no app restart needed.
     * we would ideally run this only if restream can be enabled, but multistream tests fail if we get that specific
     */
    const areNoPlatformsEnabled = () => Object.values(platforms!).every(p => !p.enabled);

    if (areNoPlatformsEnabled()) {
      const primaryPlatform = this.userView.auth?.primaryPlatform;
      if (primaryPlatform && platforms[primaryPlatform]) {
        platforms[primaryPlatform]!.enabled = true;
      }
    }

    return {
      platforms,
      advancedMode: !!this.streamSettingsView.state.goLiveSettings?.advancedMode,
      optimizedProfile: undefined,
      customDestinations: savedGoLiveSettings?.customDestinations || [],
    };
  }

  get isAdvancedMode(): boolean {
    return (this.isMultiplatformMode || this.isDualOutputMode) && this.settings.advancedMode;
  }

  /**
   * Returns common fields for the stream such as title, description, game
   */
  getCommonFields(platforms: IGoLiveSettings['platforms']) {
    const commonFields = {
      title: '',
      description: '',
    };
    const destinations = Object.keys(platforms) as TPlatform[];
    const enabledDestinations = destinations.filter(dest => platforms[dest]?.enabled);
    const destinationsWithCommonSettings = enabledDestinations.filter(
      dest => !platforms[dest]!.useCustomFields,
    );
    const destinationWithCustomSettings = difference(
      enabledDestinations,
      destinationsWithCommonSettings,
    );

    // search fields in platforms that don't use custom settings first
    destinationsWithCommonSettings.forEach(platform => {
      const destSettings = getDefined(platforms[platform]);
      Object.keys(commonFields).forEach(fieldName => {
        // TODO: index
        // @ts-ignore
        if (commonFields[fieldName] || !destSettings[fieldName]) return;
        // TODO: index
        // @ts-ignore
        commonFields[fieldName] = destSettings[fieldName];
      });
    });

    // search fields in platforms that have custom fields
    destinationWithCustomSettings.forEach(platform => {
      const destSettings = getDefined(platforms[platform]);
      Object.keys(commonFields).forEach(fieldName => {
        // TODO: index
        // @ts-ignore
        if (commonFields[fieldName] || !destSettings[fieldName]) return;
        // TODO: index
        // @ts-ignore
        commonFields[fieldName] = destSettings[fieldName];
      });
    });
    return commonFields;
  }

  applyCommonFields(platforms: IGoLiveSettings['platforms']): IGoLiveSettings['platforms'] {
    const commonFields = this.getCommonFields(platforms);
    const result = {} as IGoLiveSettings['platforms'];
    Object.keys(platforms).forEach(platform => {
      // TODO: index
      // @ts-ignore
      result[platform] = platforms[platform];
      // TODO: index
      // @ts-ignore
      result[platform].title = platforms[platform].title || commonFields.title;
      // TODO: index
      // @ts-ignore
      result[platform].description = platforms[platform].description || commonFields.description;
    });
    return result;
  }

  /**
   * return common fields for the stream such title, description, game
   */
  get commonFields(): { title: string; description: string } {
    return this.getCommonFields(this.settings.platforms);
  }

  /**
   * Sort the platform list
   * - linked platforms are always on the top of the list
   * - the rest has an alphabetic sort
   *
   * We no longer put primary platform on top since we're allowing it to be switched
   */
  getSortedPlatforms(platforms: TPlatform[]): TPlatform[] {
    platforms = platforms.sort();
    return [
      ...platforms.filter(p => this.isPlatformLinked(p)),
      ...platforms.filter(p => !this.isPlatformLinked(p)),
    ];
  }

  /**
   * Get the mode name based on the platform or destination display
   */
  getDisplayContextName(display: TDisplayType): TOutputOrientation {
    return this.dualOutputView.getDisplayContextName(display);
  }

  /**
   * returns `true` if all target platforms have prepopulated their settings
   */
  isPrepopulated(): boolean {
    return this.enabledPlatforms.map(getPlatformService).every(p => p.state.isPrepopulated);
  }

  /**
   * Returns true if given platforms have a capability
   */
  supports(capability: TPlatformCapability, targetPlatforms?: TPlatform[]): boolean {
    const platforms = targetPlatforms || this.enabledPlatforms;
    for (const platform of platforms) {
      if (getPlatformService(platform).hasCapability(capability)) return true;
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

  get isLoading() {
    const { error, lifecycle } = this.info;
    return !error && ['empty', 'prepopulate'].includes(lifecycle);
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
    return !!Object.keys(this.info.checklist).find(
      // TODO: index
      // @ts-ignore
      check => this.info.checklist[check] === 'failed',
    );
  }

  /**
   * Return true if one of the checks is in a pending state
   */
  hasPendingChecks(): boolean {
    return !!Object.keys(this.info.checklist).find(
      // TODO: index
      // @ts-ignore
      check => this.info.checklist[check] === 'pending',
    );
  }

  /**
   * Return settings for a single platform
   */
  getPlatformSettings<T extends TPlatform>(platform: T): IGoLiveSettings['platforms'][T] {
    return this.settings.platforms[platform];
  }

  setPrimaryPlatform(platform: TPlatform) {
    this.userView.setPrimaryPlatform(platform);
  }

  /**
   * Returns Go-Live settings for a given platform
   */
  private getSavedPlatformSettings(platform: TPlatform) {
    const service = getPlatformService(platform);
    const savedDestinations = this.streamSettingsView.state.goLiveSettings?.platforms;
    // TODO: index
    // @ts-ignore
    const { enabled, useCustomFields } = (savedDestinations && savedDestinations[platform]) || {
      enabled: false,
      useCustomFields: false,
    };
    const settings = cloneDeep(service.state.settings);

    // don't reuse broadcastId and thumbnail for Youtube
    // TODO: index
    // @ts-ignore
    if (settings && settings['broadcastId']) settings['broadcastId'] = '';
    // TODO: index
    // @ts-ignore
    if (settings && settings['thumbnail']) settings['thumbnail'] = '';

    // don't reuse liveVideoId for Facebook
    // TODO: index
    // @ts-ignore
    if (platform === 'facebook' && settings && settings['liveVideoId']) {
      // TODO: index
      // @ts-ignore
      settings['liveVideoId'] = '';
    }

    // make sure platforms assigned to the vertical display in dual output mode still go live in single output mode
    const display = this.isDualOutputMode
      ? this.dualOutputView.getPlatformDisplay(platform)
      : 'horizontal';

    return {
      ...settings,
      display,
      enabled,
      useCustomFields,
    };
  }

  get delayEnabled() {
    return this.streamSettingsView.settings.delayEnable;
  }

  get delaySeconds() {
    return this.streamSettingsView.settings.delaySec;
  }

  get isStreaming() {
    return this.streamingState.streamingStatus !== EStreamingState.Offline;
  }

  get isRecording() {
    return this.streamingState.recordingStatus !== ERecordingState.Offline;
  }

  get isReplayBufferActive() {
    return this.streamingState.replayBufferStatus !== EReplayBufferState.Offline;
  }

  get isIdle(): boolean {
    return !this.isStreaming && !this.isRecording;
  }

  // TODO: consolidate between this and GoLiveSettings
  get hasDestinations() {
    return this.enabledPlatforms.length > 0 || this.customDestinations.length > 0;
  }
}
