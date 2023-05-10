import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDisplayPlatforms,
  TDualOutputPlatformSettings,
  DualOutputPlatformSettings,
  TDualOutputDisplayType,
  IDualOutputPlatformSetting,
} from './dual-output-data';
import { verticalDisplayData } from '../settings-v2/default-settings-data';
import { ScenesService, SceneItem, IPartialSettings, IScene } from 'services/scenes';
import { IVideoSetting, TDisplayType, VideoSettingsService } from 'services/settings-v2/video';
import { StreamingService } from 'services/streaming';
import { SceneCollectionsService } from 'services/scene-collections';
import { TPlatform } from 'services/platforms';
import { EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import { EditorCommandsService } from 'services/editor-commands';
import { Subject } from 'rxjs';
import { SettingsManagerService } from 'services/settings-manager';
import { TOutputOrientation } from 'services/restream';
import { IVideoInfo } from 'obs-studio-node';

interface IDualOutputVideoSettings {
  defaultDisplay: TDisplayType;
  vertical: IVideoInfo;
  activeDisplays: {
    horizontal: boolean;
    vertical: boolean;
  };
}
interface IDualOutputServiceState {
  displays: TDisplayType[];
  platformSettings: TDualOutputPlatformSettings;
  dualOutputMode: boolean;
  sceneNodeMaps: { [sceneId: string]: Dictionary<string> };
  videoSettings: IDualOutputVideoSettings;
}

class DualOutputViews extends ViewHandler<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private videoSettingsService: VideoSettingsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private settingsManagerService: SettingsManagerService;

  get dualOutputMode(): boolean {
    return this.state.dualOutputMode;
  }

  get shouldCreateVerticalNode(): boolean {
    return this.isVerticalActive || this.hasVerticalNodes;
  }

  get platformSettings() {
    return this.state.platformSettings;
  }

  get hasVerticalNodes() {
    return this.state.sceneNodeMaps.hasOwnProperty(this.scenesService.views.activeSceneId);
  }

  get hasVerticalContext() {
    return !!this.videoSettingsService.state.vertical;
  }

  get verticalNodeIds(): string[] {
    const activeSceneId = this.scenesService.views.activeSceneId;

    if (!this.hasVerticalNodes) return;

    return Object.entries(this.state.sceneNodeMaps[activeSceneId]).map(
      ([key, value]: [string, string]) => value,
    );
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

  get sceneNodeMaps() {
    return this.state.sceneNodeMaps;
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
    const sceneNodeMap = this.state.sceneNodeMaps[sceneId];
    return Object.keys(sceneNodeMap).find(
      horizontalNodeId => sceneNodeMap[horizontalNodeId] === verticalNodeId,
    );
  }

  getVerticalNodeId(defaultNodeId: string) {
    const activeSceneId: string = this.scenesService.views.activeSceneId;
    return this.hasVerticalNodes ? this.sceneNodeMaps[activeSceneId][defaultNodeId] : undefined;
  }

  getDisplayNodeVisibility(defaultNodeId: string, display?: TDisplayType) {
    if (display === 'horizontal') {
      return this.scenesService.views.getNodeVisibility(defaultNodeId);
    } else {
      const nodeId = this.getVerticalNodeId(defaultNodeId);
      return this.scenesService.views.getNodeVisibility(nodeId);
    }
  }

  getPlatformContextName(platform: TPlatform): TOutputOrientation {
    return this.getPlatformDisplay(platform) === 'horizontal' ? 'landscape' : 'portrait';
  }
}

@InitAfter('ScenesService')
@InitAfter('SceneCollectionsService')
export class DualOutputService extends PersistentStatefulService<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private videoSettingsService: VideoSettingsService;
  @Inject() private editorCommandsService: EditorCommandsService;

  static defaultState: IDualOutputServiceState = {
    displays: ['horizontal', 'vertical'],
    platformSettings: DualOutputPlatformSettings,
    dualOutputMode: false,
    sceneNodeMaps: {},
    videoSettings: {
      defaultDisplay: 'horizontal',
      vertical: verticalDisplayData, // get settings for horizontal display from obs directly
      activeDisplays: {
        horizontal: true,
        vertical: false,
      },
    },
  };

  sceneItemsConfirmed = new Subject();
  sceneItemsDestroyed = new Subject();

  get views() {
    return new DualOutputViews(this.state);
  }

  init() {
    super.init();

    // this.sceneCollectionsService.collectionInitialized.subscribe(() => {
    //   if (
    //     this.scenesService.views.getSceneItemsBySceneId(this.scenesService.views.activeSceneId)
    //       ?.length > 0
    //   ) {
    //     this.confirmOrCreateVerticalNodes();
    //   }
    // });

    // this.sceneCollectionsService.collectionSwitched.subscribe(() => {
    //   if (
    //     this.scenesService.views.getSceneItemsBySceneId(this.scenesService.views.activeSceneId)
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
    this.SET_SHOW_DUAL_OUTPUT();
  }

  /**
   * Create or confirm nodes for vertical output when toggling vertical display
   */

  confirmOrCreateVerticalNodes(sceneId?: string) {
    if (!this.videoSettingsService.state.vertical) {
      this.videoSettingsService.establishVideoContext('vertical');
    }

    if (
      !this.state.sceneNodeMaps.hasOwnProperty(sceneId ?? this.scenesService.views.activeSceneId)
    ) {
      try {
        this.mapSceneNodes(this.views.displays);
      } catch (error: unknown) {
        console.error('Error toggling Dual Output mode: ', error);
      }
    } else {
      try {
        this.assignSceneNodes();
      } catch (error: unknown) {
        console.error('Error toggling Dual Output mode: ', error);
      }
    }

    this.sceneItemsConfirmed.next();
  }

  assignSceneNodes(sceneId?: string) {
    const activeSceneId = this.scenesService.views.activeSceneId;
    const sceneItems = this.scenesService.views.getSceneItemsBySceneId(sceneId ?? activeSceneId);
    const verticalNodeIds = this.views.verticalNodeIds;

    if (!this.videoSettingsService.state.vertical) {
      this.videoSettingsService.establishVideoContext('vertical');
    }

    sceneItems.forEach(sceneItem => {
      const context = verticalNodeIds.includes(sceneItem.id) ? 'vertical' : 'horizontal';
      this.assignNodeContext(sceneItem, context);
    });
  }

  mapSceneNodes(displays: TDisplayType[], sceneId?: string) {
    const sceneToMapId = sceneId ?? this.scenesService.views.activeSceneId;
    return displays.reduce((created: boolean, display: TDisplayType, index) => {
      const isFirstDisplay = index === 0;
      if (!this.videoSettingsService.state[display]) {
        this.videoSettingsService.establishVideoContext(display);
      }
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
    return sceneNodes.reduce((created: boolean, sceneItem: SceneItem) => {
      const nodeCreatedId = this.createOrAssignOutputNode(
        sceneItem,
        display,
        isFirstDisplay,
        sceneId,
      );
      if (!nodeCreatedId) {
        created = false;
      }
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
      return sceneItem.id;
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

      this.SET_NODE_MAP_ITEM(sceneItem.id, copiedSceneItem.id, sceneId);
      return copiedSceneItem.id;
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

  removeVerticalNode(nodeId: string, sceneId: string) {
    this.REMOVE_VERTICAL_NODE(nodeId, sceneId);
  }

  restoreNodesToMap(horizontalSceneItemId: string, verticalSceneItemId: string, sceneId: string) {
    this.SET_NODE_MAP_ITEM(horizontalSceneItemId, verticalSceneItemId, sceneId);
  }

  /**
   * Settings for platforms to displays
   */

  updatePlatformSetting(platform: TPlatform, display: TDualOutputDisplayType) {
    // const service = getPlatformService(platform);
    // service.setPlatformContext(display);
    this.UPDATE_PLATFORM_SETTING(platform, display);
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

  @mutation()
  private UPDATE_PLATFORM_SETTING(platform: TPlatform | string, display: TDualOutputDisplayType) {
    this.state.platformSettings[platform] = {
      ...this.state.platformSettings[platform],
      display,
    };
  }

  @mutation()
  private SET_NODE_MAP_ITEM(
    originalSceneNodeId: string,
    copiedSceneNodeId: string,
    sceneId: string,
  ) {
    if (!this.state.sceneNodeMaps.hasOwnProperty(sceneId)) {
      this.state.sceneNodeMaps[sceneId] = {};
    }

    this.state.sceneNodeMaps[sceneId] = {
      ...this.state.sceneNodeMaps[sceneId],
      [originalSceneNodeId]: copiedSceneNodeId,
    };
  }

  @mutation()
  private REMOVE_VERTICAL_NODE(nodeId: string, sceneId: string) {
    // remove nodes from scene map

    const { entry, ...sceneNodeMap } = this.state.sceneNodeMaps[sceneId];

    this.state.sceneNodeMaps = { ...this.state.sceneNodeMaps, [sceneId]: sceneNodeMap };
  }

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
}
