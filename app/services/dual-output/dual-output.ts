import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDisplayPlatforms,
  TDualOutputPlatformSettings,
  DualOutputPlatformSettings,
  IDualOutputDestinationSetting,
  IDualOutputPlatformSetting,
} from './dual-output-data';
import { verticalDisplayData } from '../settings-v2/default-settings-data';
import { ScenesService, SceneItem, IPartialSettings, IScene } from 'services/scenes';
import { IVideoSetting, TDisplayType, VideoSettingsService } from 'services/settings-v2/video';
import { StreamingService } from 'services/streaming';
import { TPlatform } from 'services/platforms';
import { EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import { EditorCommandsService } from 'services/editor-commands';
import { Subject } from 'rxjs';
import { TOutputOrientation } from 'services/restream';
import { IVideoInfo } from 'obs-studio-node';
import { StreamSettingsService, ICustomStreamDestination } from 'services/settings/streaming';
import { SceneCollectionsService } from 'services/scene-collections';

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
  @Inject() private streamingService: StreamingService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;

  get activeSceneId(): string {
    return this.scenesService.views.activeSceneId;
  }

  get dualOutputMode(): boolean {
    return this.state.dualOutputMode;
  }

  get isLoading(): boolean {
    return this.state.isLoading;
  }

  get sceneNodeMaps() {
    return this.sceneCollectionsService.activeCollection.sceneNodeMaps;
  }

  get activeSceneNodeMap() {
    return this.sceneCollectionsService.sceneNodeMaps[this.activeSceneId];
  }

  get shouldCreateVerticalNode(): boolean {
    return this.isVerticalActive || this.hasVerticalNodes;
  }

  get platformSettings() {
    return this.state.platformSettings;
  }

  get destinationSettings() {
    return this.state.destinationSettings;
  }

  get hasVerticalNodes() {
    return !!this.sceneNodeMaps[this.activeSceneId];
  }

  get hasVerticalContext() {
    return !!this.videoSettingsService.state.vertical;
  }

  get verticalNodeIds(): string[] {
    console.log('this.activeSceneId ', this.activeSceneId);
    console.log('this.sceneNodeMaps ', this.sceneNodeMaps);
    if (!this.activeSceneNodeMap) return;

    console.log('Object.values(this.activeSceneNodeMap) ', Object.values(this.activeSceneNodeMap));
    return Object.values(this.activeSceneNodeMap);
    // return Object.entries(this.activeSceneNodeMap).map(([key, value]: [string, string]) => value);
  }

  get displays() {
    return this.state.displays;
  }

  get contextsToStream(): TDisplayType[] {
    return Object.entries(this.activeDisplayPlatforms).reduce(
      (contextNames: TDisplayType[], [key, value]: [TDisplayType, TPlatform[]]) => {
        if (value.length) {
          contextNames.push(key);
        }
        return contextNames;
      },
      [],
    );
  }

  get activeDisplayPlatforms() {
    const enabledPlatforms = this.streamingService.views.enabledPlatforms;
    return Object.entries(this.state.platformSettings).reduce(
      (displayPlatforms: TDisplayPlatforms, [key, val]: [string, IDualOutputPlatformSetting]) => {
        if (val && enabledPlatforms.includes(val.platform)) {
          displayPlatforms[val.display].push(val.platform);
        }
        return displayPlatforms;
      },
      { horizontal: [], vertical: [] },
    );
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

  get isHorizontalActive() {
    return this.state.videoSettings.activeDisplays.horizontal;
  }

  get isVerticalActive() {
    return this.state.videoSettings.activeDisplays.vertical;
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

  getHorizontalNodeId(verticalNodeId: string, sceneId: string) {
    const sceneNodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;
    return Object.values(sceneNodeMap).find(
      (horizontalNodeId: string) => sceneNodeMap[horizontalNodeId] === verticalNodeId,
    );
  }

  getVerticalNodeId(defaultNodeId: string): string {
    return this.activeSceneNodeMap ? this.activeSceneNodeMap[defaultNodeId] : undefined;
  }

  getDisplayNodeVisibility(defaultNodeId: string, display?: TDisplayType) {
    if (display === 'horizontal') {
      return this.scenesService.views.getNodeVisibility(defaultNodeId);
    } else {
      const nodeId = this.getVerticalNodeId(defaultNodeId);
      return this.scenesService.views.getNodeVisibility(nodeId);
    }
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

  getPlatformContextName(platform: TPlatform): TOutputOrientation {
    return this.getPlatformDisplay(platform) === 'horizontal' ? 'landscape' : 'portrait';
  }

  hasNodeMap(sceneId?: string) {
    return sceneId ? !!this.sceneNodeMaps[sceneId] : !!this.activeSceneNodeMap;
  }
}

@InitAfter('ScenesService')
export class DualOutputService extends PersistentStatefulService<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private videoSettingsService: VideoSettingsService;
  @Inject() private editorCommandsService: EditorCommandsService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private streamingService: StreamingService;

  static defaultState: IDualOutputServiceState = {
    displays: ['horizontal', 'vertical'],
    platformSettings: DualOutputPlatformSettings,
    destinationSettings: {},
    dualOutputMode: false,
    // sceneNodeMaps: {},
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

  sceneItemsConfirmed = new Subject();
  sceneItemsDestroyed = new Subject();
  sceneItemHandled = new Subject<number>();

  get views() {
    return new DualOutputViews(this.state);
  }

  init() {
    super.init();

    this.confirmDestinationDisplays(this.streamingService.views.customDestinations);

    this.sceneCollectionsService.collectionSwitched.subscribe(() => {
      if (this.state.dualOutputMode) {
        this.setIsCollectionOrSceneLoading(false);
      }
    });
    // this.sceneCollectionsService.activeCollectionSet.subscribe(collection => {
    //   if (this.state.dualOutputMode) {
    //     // collection.sceneNodeMaps
    //   }
    // })

    // this.sceneCollectionsService.collectionSwitched.subscribe(collection => {
    //   if (
    //     this.scenesService.views.getSceneItemsBySceneId(this.views.activeSceneId)
    //       ?.length > 0
    //   ) {
    //     this.confirmOrCreateVerticalNodes();
    //   }
    // });

    // this.sceneCollectionsService.collectionSwitched.subscribe(() => {
    //   console.log('switched');
    //   this.confirmOrCreateVerticalNodes();
    // });

    // this.sceneCollectionsService.collectionAdded.subscribe(collection => {
    //   console.log('added');
    //   this.confirmOrCreateVerticalNodes();
    // });

    // this.sceneCollectionsService.collectionInitialized.subscribe(() => {
    //   console.log('collection init');
    //   this.confirmOrCreateVerticalNodes();
    // });

    this.scenesService.sceneWillSwitch.subscribe(() => {
      if (this.state.dualOutputMode && !this.state.isLoading) {
        this.setIsCollectionOrSceneLoading(true);
      }
    });

    this.scenesService.sceneSwitched.subscribe(scene => {
      console.log('scene switched');
      // confirm scene collection node map is initiated ??

      // if the scene is not empty, handle vertical nodes
      if (scene?.nodes.length) {
        console.log('------------ mapping this.views.sceneNodeMaps ', this.views.sceneNodeMaps);
        this.confirmOrCreateVerticalNodes(scene.id);
      }

      if (this.state.dualOutputMode) {
        this.setIsCollectionOrSceneLoading(false);
      }
    });

    // this.sceneCollectionsService.collectionSwitched.subscribe(() => {
    //   if (
    //     this.scenesService.views.getSceneItemsBySceneId(this.views.activeSceneId)
    //       ?.length > 0
    //   ) {
    //     this.confirmOrCreateVerticalNodes();
    //   }
    // });

    // this.scenesService.sceneAdded.subscribe((scene: IScene) => {
    //   if (this.videoSettingsService.state.vertical) {
    //     this.assignSceneNodes(scene.id);
    //   }
    // });

    // this.scenesService.sceneSwitched.subscribe((scene: IScene) => {
    //   if (this.scenesService.views.getSceneItemsBySceneId(scene.id)?.length > 0) {
    //     this.confirmOrCreateVerticalNodes(scene.id);
    //   }
    // });
  }

  /**
   * Edit dual output display settings
   */

  setdualOutputMode() {
    this.confirmOrCreateVerticalNodes();
    this.SET_SHOW_DUAL_OUTPUT();
  }

  /**
   * Create or confirm nodes for vertical output when toggling vertical display
   */

  confirmOrCreateVerticalNodes(sceneId?: string) {
    if (this.state.dualOutputMode && !this.videoSettingsService.contexts.vertical) {
      this.videoSettingsService.establishVideoContext('vertical');
    }
    console.log('sceneNodeMaps ', this.views.sceneNodeMaps);
    console.log('activeCollection ', this.sceneCollectionsService.activeCollection);
    if (!this.views.hasNodeMap(sceneId) && this.state.dualOutputMode) {
      try {
        console.log('CREATING');
        this.createSceneNodes(this.views.displays);
      } catch (error: unknown) {
        console.error('Error toggling Dual Output mode: ', error);
      }
    } else {
      try {
        console.log('ASSIGNING');
        this.assignSceneNodes();
      } catch (error: unknown) {
        console.error('Error toggling Dual Output mode: ', error);
      }
    }

    this.sceneItemsConfirmed.next();
  }

  assignSceneNodes(sceneId?: string) {
    // assign nodes to both contexts in dual output mode
    if (this.state.dualOutputMode && this.views.hasNodeMap(sceneId)) {
      if (!this.videoSettingsService.contexts.vertical) {
        this.videoSettingsService.establishVideoContext('vertical');
      }

      const sceneToMapId = sceneId ?? this.views.activeSceneId;
      const sceneItems = this.scenesService.views.getSceneItemsBySceneId(sceneToMapId);
      const verticalNodeIds = this.views.verticalNodeIds;

      sceneItems.forEach((sceneItem: SceneItem, index: number) => {
        const display = verticalNodeIds?.includes(sceneItem.id) ? 'vertical' : 'horizontal';
        this.assignNodeContext(sceneItem, display);
        this.sceneItemHandled.next(index);
      });
    } else {
      // only assign scene node context to horizontal nodes when dual output mode is off
      const sceneToMapId = sceneId ?? this.views.activeSceneId;
      const sceneItems = this.scenesService.views.getSceneItemsBySceneId(sceneToMapId);

      sceneItems.forEach((sceneItem: SceneItem, index: number) => {
        this.assignNodeContext(sceneItem, 'horizontal');
        this.sceneItemHandled.next(index);
      });
    }
  }

  createSceneNodes(displays: TDisplayType[], sceneId?: string) {
    if (this.state.dualOutputMode && !this.videoSettingsService.contexts.vertical) {
      this.videoSettingsService.establishVideoContext('vertical');
    }

    const sceneToMapId = sceneId ?? this.views.activeSceneId;
    return displays.reduce((created: boolean, display: TDisplayType, index) => {
      const isFirstDisplay = index === 0;

      const nodesCreated = this.createOutputNodes(sceneToMapId, display, isFirstDisplay);
      if (!nodesCreated) {
        created = false;
      }

      return created;
    }, true);
  }

  createOutputNodes(sceneId: string, display: TDisplayType, isFirstDisplay: boolean) {
    const sceneNodes = this.scenesService.views.getSceneItemsBySceneId(sceneId);
    if (!sceneNodes) return false;
    return sceneNodes.reduce((created: boolean, sceneItem: SceneItem, index: number) => {
      const nodeCreatedId = this.createOrAssignOutputNode(
        sceneItem,
        display,
        isFirstDisplay,
        sceneId,
      );
      if (!nodeCreatedId) {
        created = false;
      }
      this.sceneItemHandled.next(index);
      return created;
    }, true);
  }

  createOrAssignOutputNode(
    sceneItem: SceneItem,
    display: TDisplayType,
    isFirstDisplay: boolean,
    sceneId?: string,
  ) {
    if (isFirstDisplay) {
      // if it's the first display, just assign the scene item's output to a context
      this.assignNodeContext(sceneItem, display);
      return sceneItem;
    } else {
      // if it's not the first display, copy the scene item
      const scene = this.scenesService.views.getScene(sceneId);
      const copiedSceneItem = scene.addSource(sceneItem.sourceId);
      const context = this.videoSettingsService.contexts[display];

      if (!copiedSceneItem || !context) return null;

      const settings: IPartialSettings = { ...sceneItem.getSettings(), output: context, display };
      copiedSceneItem.setSettings(settings);

      const selection = scene.getSelection(copiedSceneItem.id);
      this.editorCommandsService.executeCommand(
        'ReorderNodesCommand',
        selection,
        sceneItem.id,
        EPlaceType.Before,
      );

      this.sceneCollectionsService.createNodeMapEntry(sceneId, sceneItem.id, copiedSceneItem.id);
      // this.SET_NODE_MAP_ITEM(display, sceneItem.id, copiedSceneItem.id, sceneId);
      return copiedSceneItem;
    }
  }

  assignNodeContext(sceneItem: SceneItem, display: TDisplayType) {
    const context = this.videoSettingsService.contexts[display];
    if (!context) return null;

    sceneItem.setSettings({ output: context, display });
    return sceneItem.id;
  }

  /**
   * Helper functions for adding and removing scene items in dual output mode
   */

  removeVerticalNode(sceneId: string, nodeId: string) {
    console.log('removing ', nodeId, ' from ', sceneId);
    this.scenesService.views.getScene(sceneId).removeItem(nodeId);
    this.sceneCollectionsService.removeVerticalNode(sceneId, nodeId);
  }

  restoreNodesToMap(
    display: TDisplayType,
    horizontalSceneItemId: string,
    verticalSceneItemId: string,
    sceneId: string,
  ) {
    this.sceneCollectionsService.createNodeMapEntry(
      sceneId,
      horizontalSceneItemId,
      verticalSceneItemId,
    );
    // this.SET_NODE_MAP_ITEM(display, horizontalSceneItemId, verticalSceneItemId, sceneId);
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

  confirmDestinationDisplays(destinations: ICustomStreamDestination[]) {
    if (destinations.length) {
      destinations.forEach((destination: ICustomStreamDestination) => {
        if (!this.state.destinationSettings[destination.name]) {
          this.updateDestinationSetting(destination.name);
        }
      });
    }
  }

  /**
   * Toggle display
   */

  toggleDisplay(status: boolean, display: TDisplayType) {
    // swap default display if needed
    if (!status) {
      const otherDisplay = display === 'horizontal' ? 'vertical' : 'horizontal';
      this.setDefaultDisplay(otherDisplay);
    }

    if (
      this.state.videoSettings.activeDisplays.horizontal &&
      this.state.videoSettings.activeDisplays.vertical
    ) {
      // toggle off dual output mode
      this.setDisplayActive(false, display);
    } else {
      // toggle display
      this.sceneItemsConfirmed.subscribe(() => {
        this.setDisplayActive(status, display);
      });
      this.actions.confirmOrCreateVerticalNodes();
    }
  }

  /**
   * Update default display
   */

  setDefaultDisplay(display: TDisplayType) {
    this.SET_DEFAULT_DISPLAY(display);
  }

  private setDisplayActive(status: boolean, display: TDisplayType) {
    this.SET_DISPLAY_ACTIVE(status, display);
  }

  /**
   * Update Video Settings
   */

  setVideoSetting(setting: Partial<IVideoSetting>, display?: TDisplayType) {
    this.SET_VIDEO_SETTING(setting, display);
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

  // @mutation()
  // private SET_NODE_MAP_ITEM(
  //   display: TDisplayType,
  //   originalSceneNodeId: string,
  //   copiedSceneNodeId: string,
  //   sceneId?: string,
  // ) {
  //   if (display === 'vertical') {
  //     this.activeSceneNodeMap = {
  //       ...this.activeSceneNodeMap,
  //       [originalSceneNodeId]: copiedSceneNodeId,
  //     };
  //   }
  // }

  // @mutation()
  // private REMOVE_VERTICAL_NODE(nodeId: string, sceneId: string) {
  //   // remove nodes from scene map

  //   const { entry, ...sceneNodeMap } = this.activeSceneNodeMap;

  //   this.state.sceneNodeMaps = { ...this.state.sceneNodeMaps, [sceneId]: sceneNodeMap };
  // }

  // @mutation()
  // private REMOVE_DUAL_OUTPUT_NODES(nodeId: string) {
  //   // remove all vertical nodes from scene

  //   let newMap = {};
  //   for (const display in this.state.sceneNodeMaps) {
  //     newMap = {
  //       ...newMap,
  //       [display]: Object.entries(this.state.sceneNodeMaps[display]).filter(
  //         ([key, val]) => key !== nodeId,
  //       ),
  //     };
  //   }
  //   this.state.sceneNodeMaps = newMap;
  // }

  @mutation()
  private SET_SHOW_DUAL_OUTPUT() {
    this.state = {
      ...this.state,
      dualOutputMode: !this.state.dualOutputMode,
    };
  }

  @mutation()
  private SET_DISPLAY_ACTIVE(status: boolean, display: TDisplayType) {
    const otherDisplay = display === 'horizontal' ? 'vertical' : 'horizontal';
    if (
      status === false &&
      this.state.videoSettings.activeDisplays[display] &&
      !this.state.videoSettings.activeDisplays[otherDisplay]
    ) {
      // if not dual output mode, swap the active displays

      this.state.videoSettings.activeDisplays = {
        ...this.state.videoSettings.activeDisplays,
        [display]: status,
        [otherDisplay]: !status,
      };
    } else {
      this.state.videoSettings.activeDisplays = {
        ...this.state.videoSettings.activeDisplays,
        [display]: status,
      };
    }
  }

  @mutation()
  private SET_VIDEO_SETTING(setting: Partial<IVideoSetting>, display: TDisplayType = 'vertical') {
    this.state.videoSettings.activeDisplays = {
      ...this.state.videoSettings.activeDisplays,
      [display]: setting,
    };
  }

  @mutation()
  private SET_DEFAULT_DISPLAY(display: TDisplayType) {
    this.state.videoSettings.defaultDisplay = display;
  }

  @mutation()
  private SET_IS_LOADING(status: boolean) {
    this.state = { ...this.state, isLoading: status };
  }
}
