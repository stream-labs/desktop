import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDisplayPlatforms,
  TDualOutputPlatformSettings,
  DualOutputPlatformSettings,
  EDualOutputPlatform,
  TDualOutputDisplayType,
  IDualOutputPlatformSetting,
} from './dual-output-data';
import { ScenesService, SceneItem, IPartialSettings, IScene } from 'services/scenes';
import { TDisplayType, VideoSettingsService } from 'services/settings-v2/video';
import { StreamingService } from 'services/streaming';
import { SceneCollectionsService } from 'services/scene-collections';
import { getPlatformService, TPlatform } from 'services/platforms';
import { EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import { EditorCommandsService } from 'services/editor-commands';
import { Subject } from 'rxjs';
import { SettingsManagerService } from 'services/settings-manager';
import { TOutputOrientation } from 'services/restream';
interface IDualOutputServiceState {
  displays: TDisplayType[];
  platformSettings: TDualOutputPlatformSettings;
  dualOutputMode: boolean;
  sceneNodeMaps: { [sceneId: string]: Dictionary<string> };
}

class DualOutputViews extends ViewHandler<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private videoSettingsService: VideoSettingsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private settingsManagerService: SettingsManagerService;

  get dualOutputMode(): boolean {
    return (
      this.settingsManagerService.views.activeDisplays.horizontal &&
      this.settingsManagerService.views.activeDisplays.vertical
    );
  }

  get shouldCreateVerticalNode(): boolean {
    return this.settingsManagerService.views.isVerticalActive || this.hasVerticalNodes;
  }

  get platformSettings() {
    return this.state.platformSettings;
  }

  get platformSettingsList(): IDualOutputPlatformSetting[] {
    return Object.values(this.state.platformSettings);
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

  getPlatformDisplay(platform: TPlatform) {
    return this.state.platformSettings[platform].display;
  }

  getPlatformContext(platform: TPlatform) {
    const display = this.getPlatformDisplay(platform);
    return this.videoSettingsService.state[display];
  }

  getPlatformContextName(platform: TPlatform): TOutputOrientation {
    return this.getPlatformDisplay(platform) === 'horizontal' ? 'landscape' : 'portrait';
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
  };

  sceneItemsConfirmed = new Subject();
  sceneItemsDestroyed = new Subject();

  get views() {
    return new DualOutputViews(this.state);
  }

  init() {
    super.init();

    this.sceneCollectionsService.collectionInitialized.subscribe(() => {
      if (
        this.scenesService.views.getSceneItemsBySceneId(this.scenesService.views.activeSceneId)
          ?.length > 0
      ) {
        this.confirmOrCreateVerticalNodes();
      }
    });

    this.sceneCollectionsService.collectionSwitched.subscribe(() => {
      if (
        this.scenesService.views.getSceneItemsBySceneId(this.scenesService.views.activeSceneId)
          ?.length > 0
      ) {
        this.confirmOrCreateVerticalNodes();
      }
    });

    this.scenesService.sceneAdded.subscribe((scene: IScene) => {
      if (this.videoSettingsService.state.vertical) {
        this.assignSceneNodes(scene.id);
      }
    });

    this.scenesService.sceneSwitched.subscribe((scene: IScene) => {
      if (this.scenesService.views.getSceneItemsBySceneId(scene.id)?.length > 0) {
        this.confirmOrCreateVerticalNodes(scene.id);
      }
    });
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

  @mutation()
  private UPDATE_PLATFORM_SETTING(
    platform: EDualOutputPlatform | string,
    display: TDualOutputDisplayType,
  ) {
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
}
