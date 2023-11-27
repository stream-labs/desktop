import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDualOutputPlatformSettings,
  DualOutputPlatformSettings,
  IDualOutputDestinationSetting,
} from './dual-output-data';
import { verticalDisplayData } from '../settings-v2/default-settings-data';
import { ScenesService, SceneItem, TSceneNode } from 'services/scenes';
import { TDisplayType, VideoSettingsService } from 'services/settings-v2/video';
import { TPlatform } from 'services/platforms';
import { EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import { EditorCommandsService } from 'services/editor-commands';
import { Subject } from 'rxjs';
import { TOutputOrientation } from 'services/restream';
import { IVideoInfo } from 'obs-studio-node';
import { ICustomStreamDestination, StreamSettingsService } from 'services/settings/streaming';
import {
  ISceneCollectionsManifestEntry,
  SceneCollectionsService,
} from 'services/scene-collections';
import { UserService } from 'services/user';
import { SelectionService } from 'services/selection';
import { StreamingService } from 'services/streaming';
import { SettingsService } from 'services/settings';
import { RunInLoadingMode } from 'services/app/app-decorators';

interface IDisplayVideoSettings {
  defaultDisplay: TDisplayType;
  horizontal: IVideoInfo;
  vertical: IVideoInfo;
  activeDisplays: {
    horizontal: boolean;
    vertical: boolean;
  };
}
interface IDualOutputServiceState {
  displays: TDisplayType[];
  platformSettings: TDualOutputPlatformSettings;
  destinationSettings: Dictionary<IDualOutputDestinationSetting>;
  dualOutputMode: boolean;
  videoSettings: IDisplayVideoSettings;
  isLoading: boolean;
}

class DualOutputViews extends ViewHandler<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private videoSettingsService: VideoSettingsService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private streamingService: StreamingService;

  get isLoading(): boolean {
    return this.state.isLoading;
  }

  get activeSceneId(): string {
    return this.scenesService.views.activeSceneId;
  }

  get dualOutputMode(): boolean {
    return this.state.dualOutputMode;
  }

  get activeCollection(): ISceneCollectionsManifestEntry {
    return this.sceneCollectionsService.activeCollection;
  }

  get sceneNodeMaps(): { [sceneId: string]: Dictionary<string> } {
    return this.activeCollection?.sceneNodeMaps || {};
  }

  get activeSceneNodeMap(): Dictionary<string> {
    return this.sceneCollectionsService?.sceneNodeMaps?.[this.activeSceneId];
  }

  /**
   * Confirm that an entry exists in the scene collections manifest's scene node map property
   */
  get hasVerticalNodes() {
    return !!this.sceneNodeMaps[this.activeSceneId];
  }

  /**
   * Determines if there are any node maps in the scene collections scene node map property in the
   * scene collections manifest. The existence of the node map in the scene collections manifest
   * shows that the scene collection has been converted to a dual output scene collection. To prevent
   * undefined or null errors from unexpected behavior, confirm that there are any entries in the
   * collection's scene node maps property.
   *
   * Also check to see if dual output mode is active so that a new scene created in dual output mode
   * will correctly create item and show display toggles.
   */
  get hasSceneNodeMaps(): boolean {
    const nodeMaps = this.sceneCollectionsService?.sceneNodeMaps;
    return this.dualOutputMode || (!!nodeMaps && Object.entries(nodeMaps).length > 0);
  }

  get platformSettings() {
    return this.state.platformSettings;
  }

  get destinationSettings() {
    return this.state.destinationSettings;
  }

  get horizontalNodeIds(): string[] {
    if (!this.activeSceneNodeMap) return;

    return Object.keys(this.activeSceneNodeMap);
  }

  get verticalNodeIds(): string[] {
    if (!this.activeSceneNodeMap) return;

    return Object.values(this.activeSceneNodeMap);
  }

  get displays() {
    return this.state.displays;
  }

  get videoSettings() {
    return this.state.videoSettings;
  }

  get activeDisplays() {
    return this.state.videoSettings.activeDisplays;
  }

  get defaultDisplay() {
    return this.state.videoSettings.defaultDisplay;
  }

  get showHorizontalDisplay() {
    return !this.state.dualOutputMode || (this.activeDisplays.horizontal && !this.state.isLoading);
  }

  get showVerticalDisplay() {
    return this.state.dualOutputMode && this.activeDisplays.vertical && !this.state.isLoading;
  }

  get onlyVerticalDisplayActive() {
    return this.activeDisplays.vertical && !this.activeDisplays.horizontal;
  }

  getPlatformDisplay(platform: TPlatform) {
    return this.state.platformSettings[platform].display;
  }

  getPlatformContext(platform: TPlatform) {
    const display = this.getPlatformDisplay(platform);
    return this.videoSettingsService.state[display];
  }

  getPlatformMode(platform: TPlatform): TOutputOrientation {
    const display = this.getPlatformDisplay(platform);
    if (!display) return 'landscape';
    return display === 'horizontal' ? 'landscape' : 'portrait';
  }

  getMode(display?: TDisplayType): TOutputOrientation {
    if (!display) return 'landscape';
    return display === 'horizontal' ? 'landscape' : 'portrait';
  }

  getHorizontalNodeId(verticalNodeId: string, sceneId?: string) {
    const sceneNodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;
    if (!sceneNodeMap) return;

    return Object.keys(sceneNodeMap).find(
      (horizontalNodeId: string) => sceneNodeMap[horizontalNodeId] === verticalNodeId,
    );
  }

  getVerticalNodeId(horizontalNodeId: string, sceneId?: string): string {
    const sceneNodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;
    if (!sceneNodeMap) return;

    return Object.values(sceneNodeMap).find(
      (verticalNodeId: string) => sceneNodeMap[horizontalNodeId] === verticalNodeId,
    );
  }

  getDualOutputNodeId(nodeId: string, sceneId?: string) {
    return this.getHorizontalNodeId(nodeId, sceneId) ?? this.getVerticalNodeId(nodeId, sceneId);
  }

  getVerticalNodeIds(sceneId: string): string[] {
    if (!this.sceneNodeMaps[sceneId]) return;

    return Object.values(this.sceneNodeMaps[sceneId]);
  }

  getNodeDisplay(nodeId: string, sceneId: string) {
    const sceneNodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;

    if (sceneNodeMap && Object.values(sceneNodeMap).includes(nodeId)) {
      return 'vertical';
    }

    // return horizontal by default because if the sceneNodeMap doesn't exist
    // dual output has never been toggled on with this scene active
    return 'horizontal';
  }

  getPlatformContextName(platform?: TPlatform): TOutputOrientation {
    return this.getPlatformDisplay(platform) === 'horizontal' ? 'landscape' : 'portrait';
  }

  getDisplayContextName(display: TDisplayType): TOutputOrientation {
    return display === 'horizontal' ? 'landscape' : 'portrait';
  }

  /**
   * Get the visibility for the vertical node.
   * @remark Primarily used for the source toggles. The id of the node is determined either by the
   * @param nodeId
   * @param sceneId
   * @returns
   */
  getIsHorizontalVisible(nodeId: string, sceneId?: string) {
    if (!this.hasVerticalNodes) return false;
    return this.scenesService.views.getNodeVisibility(nodeId, sceneId ?? this.activeSceneId);
  }

  /**
   * Get the visibility for the vertical node.
   * @remark Primarily used for the source toggles. The id of the node is determined either by the
   * @param nodeId
   * @param sceneId
   * @returns
   */
  getIsVerticalVisible(nodeId: string, sceneId?: string) {
    // in the source selector, the vertical node id is determined by the visible display
    if (!this.hasVerticalNodes) return false;

    const id =
      this.activeDisplays.vertical && !this.activeDisplays.horizontal
        ? nodeId
        : this.activeSceneNodeMap[nodeId];

    return this.scenesService.views.getNodeVisibility(id, sceneId ?? this.activeSceneId);
  }

  getCanStreamDualOutput() {
    const platformDisplays = this.streamingService.views.activeDisplayPlatforms;
    const destinationDisplays = this.streamingService.views.activeDisplayDestinations;

    const horizontalHasDestinations =
      platformDisplays.horizontal.length > 0 || destinationDisplays.horizontal.length > 0;
    const verticalHasDestinations =
      platformDisplays.vertical.length > 0 || destinationDisplays.vertical.length > 0;

    return horizontalHasDestinations && verticalHasDestinations;
  }

  /**
   * Confirm if a scene has a node map for dual output.
   * @remark If the scene collection does not have the scene node maps property in the
   * scene collection manifest, this will return false.
   * @param sceneId Optional id of the scene to look up. If no scene id is provided, the active
   * scene's id will be used.
   * @returns Boolean for whether or not the scene has an entry in the scene collections scene node map.
   */
  hasNodeMap(sceneId?: string): boolean {
    if (!this.sceneCollectionsService?.sceneNodeMaps) return false;
    const nodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;
    return !!nodeMap && Object.keys(nodeMap).length > 0;
  }
}

@InitAfter('ScenesService')
export class DualOutputService extends PersistentStatefulService<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private videoSettingsService: VideoSettingsService;
  @Inject() private editorCommandsService: EditorCommandsService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private userService: UserService;
  @Inject() private selectionService: SelectionService;
  @Inject() private streamingService: StreamingService;
  @Inject() private settingsService: SettingsService;

  static defaultState: IDualOutputServiceState = {
    displays: ['horizontal', 'vertical'],
    platformSettings: DualOutputPlatformSettings,
    destinationSettings: {},
    dualOutputMode: false,
    videoSettings: {
      defaultDisplay: 'horizontal',
      horizontal: null,
      vertical: verticalDisplayData, // get settings for horizontal display from obs directly
      activeDisplays: {
        horizontal: true,
        vertical: false,
      },
    },
    isLoading: false,
  };

  sceneNodeHandled = new Subject<number>();

  get views() {
    return new DualOutputViews(this.state);
  }

  init() {
    super.init();

    // confirm custom destinations have a default display
    this.confirmDestinationDisplays();

    /**
     * The audio settings refresh each time the scene collection is switched.
     * When a collection is loaded, confirm all sources have been assigned a context.
     */
    this.settingsService.audioRefreshed.subscribe(() => {
      this.convertSceneSources(this.scenesService.views.activeSceneId);

      if (this.state.isLoading) {
        this.setIsCollectionOrSceneLoading(false);
      }
    });

    /**
     * Ensures that the scene nodes are assigned a context
     */
    this.scenesService.sceneSwitched.subscribe(scene => {
      // if the scene is not empty, handle vertical nodes
      if (scene?.nodes.length) {
        this.confirmOrCreateVerticalNodes(scene.id);
      }
    });

    /**
     * The user must be logged in to use dual output mode
     * so toggle off dual output mode on log out.
     */
    this.userService.userLogout.subscribe(() => {
      if (this.state.dualOutputMode) {
        this.setdualOutputMode();
      }
    });
  }

  /**
   * Edit dual output display settings
   */

  @RunInLoadingMode()
  setdualOutputMode(status?: boolean) {
    if (!this.userService.isLoggedIn) return;

    this.SET_SHOW_DUAL_OUTPUT(status);

    if (this.state.dualOutputMode) {
      this.confirmOrCreateVerticalNodes(this.views.activeSceneId);

      /**
       * Selective recording only works with horizontal sources, so don't show the
       * vertical display if toggling with selective recording active
       */
      if (!this.streamingService.state.selectiveRecording) {
        this.toggleDisplay(true, 'vertical');
      }
    } else {
      this.selectionService.views.globalSelection.reset();
    }

    this.settingsService.showSettings('Video');
  }

  /**
   * Create or confirm nodes for vertical output when toggling vertical display
   * @param sceneId - Id of the scene to map
   */
  confirmOrCreateVerticalNodes(sceneId: string) {
    this.convertSceneSources(sceneId);
    if (!this.views.hasNodeMap(sceneId) && this.state.dualOutputMode) {
      try {
        this.createSceneNodes(sceneId);
      } catch (error: unknown) {
        console.error('Error toggling Dual Output mode: ', error);
      }
    } else {
      try {
        this.confirmOrAssignSceneNodes(sceneId);
      } catch (error: unknown) {
        console.error('Error toggling Dual Output mode: ', error);
      }
    }
  }

  convertSceneSources(sceneId: string) {
    const sceneSources = this.scenesService.views.sceneSourcesForScene(sceneId);
    if (sceneSources.length > 0) {
      sceneSources.forEach(scene => this.confirmOrCreateVerticalNodes(scene.sourceId));
    }
  }

  /**
   * Assign or confirm node contexts to a dual output scene
   * @param sceneId - Id of the scene to map
   */
  confirmOrAssignSceneNodes(sceneId: string) {
    this.SET_IS_LOADING(true);
    const sceneItems = this.scenesService.views.getSceneItemsBySceneId(sceneId);
    if (!sceneItems) return;

    const verticalNodeIds = new Set(this.views.getVerticalNodeIds(sceneId));

    // establish vertical context if it doesn't exist
    if (
      this.views.getVerticalNodeIds(sceneId)?.length > 0 &&
      !this.videoSettingsService.contexts.vertical
    ) {
      this.videoSettingsService.establishVideoContext('vertical');
    }

    sceneItems.forEach((sceneItem: SceneItem, index: number) => {
      // Item already has a context assigned
      if (sceneItem?.output) return;

      const display = verticalNodeIds?.has(sceneItem.id) ? 'vertical' : 'horizontal';
      this.assignNodeContext(sceneItem, sceneItem?.display ?? display);
      this.sceneNodeHandled.next(index);
    });
    this.SET_IS_LOADING(false);
  }

  createSceneNodes(sceneId: string) {
    this.SET_IS_LOADING(true);
    // establish vertical context if it doesn't exist
    if (this.state.dualOutputMode && !this.videoSettingsService.contexts.vertical) {
      this.videoSettingsService.establishVideoContext('vertical');
    }

    const nodes = this.scenesService.views.getScene(sceneId).getNodes();

    this.editorCommandsService.executeCommand(
      'CopyNodesCommand',
      this.scenesService.views.getScene(sceneId).getSelection(nodes),
      sceneId,
      false,
      'vertical',
    );
    this.SET_IS_LOADING(false);
  }

  /**
   * Copy node or assign node context
   * @remark Currently, only the widget service needs to confirm the display,
   * all other function calls are to copy the horizontal node to a vertical node
   * @param sceneItem - the scene item to copy or assign context
   * @param display - the name of the context, which is also the display name
   * @param isHorizontalDisplay - whether this is the horizontal or vertical display
   * @param sceneId - the scene id where a copied node should be added, default is the active scene id
   * @returns
   */
  createOrAssignOutputNode(
    sceneItem: SceneItem,
    display: TDisplayType,
    isHorizontalDisplay: boolean,
    sceneId?: string,
    verticalNodeId?: string,
  ) {
    if (sceneItem.type === 'scene') {
      this.confirmOrCreateVerticalNodes(sceneItem.sourceId);
    }
    if (isHorizontalDisplay) {
      // if it's the first display, just assign the scene item's output to a context
      this.assignNodeContext(sceneItem, display);
      return sceneItem;
    } else {
      // if it's not the first display, copy the scene item
      const scene = this.scenesService.views.getScene(sceneId ?? this.views.activeSceneId);
      const copiedSceneItem = scene.addSource(sceneItem.sourceId, { id: verticalNodeId, display });

      if (!copiedSceneItem) return null;

      const selection = scene.getSelection(copiedSceneItem.id);
      this.editorCommandsService.executeCommand(
        'ReorderNodesCommand',
        selection,
        sceneItem.id,
        EPlaceType.Before,
      );

      this.sceneCollectionsService.createNodeMapEntry(sceneId, sceneItem.id, copiedSceneItem.id);
      return copiedSceneItem;
    }
  }

  assignNodeContext(node: TSceneNode, display: TDisplayType) {
    if (node.isItem()) {
      const context = this.videoSettingsService.contexts[display];
      if (!context) return null;
      node.setSettings({ output: context, display });
    } else {
      // because folders just group scene items, they do not have their own output value
      // set the display for toggling in the source selector
      node.setDisplay(display);
    }

    return node.id;
  }

  /**
   * Settings for platforms to displays
   */

  updatePlatformSetting(platform: string, display: TDisplayType) {
    this.UPDATE_PLATFORM_SETTING(platform, display);
  }

  updateDestinationSetting(destination: string, display?: TDisplayType) {
    this.UPDATE_DESTINATION_SETTING(destination, display);
  }

  /**
   * Confirm custom destinations have assigned displays
   */

  confirmDestinationDisplays() {
    const customDestinations = this.streamSettingsService.settings.goLiveSettings
      ?.customDestinations;
    if (!customDestinations) return;

    customDestinations.forEach((destination: ICustomStreamDestination, index: number) => {
      if (!destination.hasOwnProperty('display')) {
        const updatedDestinations = customDestinations.splice(index, 1, {
          ...destination,
          display: 'horizontal',
        });
        this.streamSettingsService.setGoLiveSettings({ customDestinations: updatedDestinations });
      }
    });
  }

  /**
   * Show/hide displays
   *
   * @param status - Boolean visibility of display
   * @param display - Name of display
   */
  toggleDisplay(status: boolean, display: TDisplayType) {
    this.SET_DISPLAY_ACTIVE(status, display);
  }

  /**
   * Update Video Settings
   */

  setVideoSetting(setting: Partial<IVideoInfo>, display?: TDisplayType) {
    this.SET_VIDEO_SETTING(setting, display);
  }

  updateVideoSettings(settings: IVideoInfo, display: TDisplayType = 'horizontal') {
    this.UPDATE_VIDEO_SETTING(settings, display);
  }

  setIsLoading(status: boolean) {
    this.SET_IS_LOADING(status);
  }

  /**
   * Update loading state to show loading animation
   */

  setIsCollectionOrSceneLoading(status: boolean) {
    this.SET_IS_LOADING(status);
  }

  @mutation()
  private UPDATE_PLATFORM_SETTING(platform: TPlatform | string, display: TDisplayType) {
    this.state.platformSettings = {
      ...this.state.platformSettings,
      [platform]: { ...this.state.platformSettings[platform], display },
    };
  }

  @mutation()
  private UPDATE_DESTINATION_SETTING(destination: string, display: TDisplayType = 'horizontal') {
    if (!this.state.destinationSettings[destination]) {
      // create setting
      this.state.destinationSettings = {
        ...this.state.destinationSettings,
        [destination]: {
          destination,
          display,
        },
      };
    } else {
      // update setting
      this.state.destinationSettings = {
        ...this.state.destinationSettings,
        [destination]: { ...this.state.destinationSettings[destination], display },
      };
    }
  }

  @mutation()
  private SET_SHOW_DUAL_OUTPUT(status?: boolean) {
    this.state = {
      ...this.state,
      dualOutputMode: status ?? !this.state.dualOutputMode,
    };
  }

  @mutation()
  private SET_DISPLAY_ACTIVE(status: boolean, display: TDisplayType) {
    this.state.videoSettings.activeDisplays = {
      ...this.state.videoSettings.activeDisplays,
      [display]: status,
    };
  }

  @mutation()
  private SET_VIDEO_SETTING(setting: Partial<IVideoInfo>, display: TDisplayType = 'vertical') {
    this.state.videoSettings[display] = {
      ...this.state.videoSettings[display],
      ...setting,
    };
  }

  @mutation()
  private UPDATE_VIDEO_SETTING(setting: IVideoInfo, display: TDisplayType = 'vertical') {
    this.state.videoSettings[display] = { ...setting };
  }

  @mutation()
  private SET_IS_LOADING(status: boolean) {
    this.state = { ...this.state, isLoading: status };
  }
}
