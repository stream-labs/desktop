import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDisplayPlatforms,
  TGreenPlatformSettings,
  GreenPlatformSettings,
  TGreenDisplayType,
  IGreenPlatformSetting,
} from './green-data';
import { ScenesService, SceneItem, IPartialSettings } from 'services/scenes';
import { TDisplayType, VideoSettingsService } from 'services/settings-v2/video';
import { StreamingService } from 'services/streaming';
import { SceneCollectionsService } from 'services/scene-collections';
import { TPlatform } from 'services/platforms';
import { ReorderNodesCommand, EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import { Subject } from 'rxjs';
import { SettingsManagerService } from 'services/settings-manager';
import { TOutputOrientation } from 'services/restream';

interface IGreenServiceState {
  displays: TDisplayType[];
  platformSettings: TGreenPlatformSettings;
  greenMode: boolean;
  nodeMaps: { [display in TDisplayType as string]: Dictionary<string> };
  sceneNodeMaps: { [sceneId: string]: Dictionary<string> };
}

class GreenViews extends ViewHandler<IGreenServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private videoSettingsService: VideoSettingsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private settingsManagerService: SettingsManagerService;

  get greenMode(): boolean {
    return (
      this.settingsManagerService.views.activeDisplays.horizontal &&
      this.settingsManagerService.views.activeDisplays.green
    );
  }

  get platformSettings() {
    return this.state.platformSettings;
  }

  get platformSettingsList(): IGreenPlatformSetting[] {
    return Object.values(this.state.platformSettings);
  }

  get hasGreenScenes() {
    if (!this.state.nodeMaps) return false;
    for (const display in this.state.nodeMaps) {
      if (!this.state.nodeMaps.hasOwnProperty(display)) {
        return false;
      }
    }
    return true;
  }

  get showGreenDisplays() {
    return this.greenMode && this.hasGreenScenes;
  }

  get hasGreenNodes() {
    return this.state.sceneNodeMaps.hasOwnProperty(this.scenesService.views.activeSceneId);
  }

  get greenNodeIds(): string[] {
    const activeSceneId = this.scenesService.views.activeSceneId;

    if (!this.hasGreenNodes) return;

    return Object.entries(this.state.sceneNodeMaps[activeSceneId]).map(
      ([key, value]: [string, string]) => value,
    );
  }

  get displays() {
    return this.state.displays;
  }

  get contextsToStream() {
    return Object.entries(this.activeDisplayPlatforms).reduce(
      (contextNames: TDisplayType[], [key, value]: [TDisplayType, TPlatform[]]) => {
        if (value.length > 0) {
          contextNames.push(key as TDisplayType);
        }
        return contextNames;
      },
      [],
    );
  }

  get activeDisplayPlatforms() {
    const enabledPlatforms = this.streamingService.views.enabledPlatforms;
    return Object.entries(this.state.platformSettings).reduce(
      (displayPlatforms: TDisplayPlatforms, [key, val]: [string, IGreenPlatformSetting]) => {
        if (val && enabledPlatforms.includes(val.platform)) {
          displayPlatforms[val.display].push(val.platform);
        }
        return displayPlatforms;
      },
      { horizontal: [], green: [] },
    );
  }

  get nodeMaps() {
    return this.state.nodeMaps;
  }

  get sceneNodeMaps() {
    return this.state.sceneNodeMaps;
  }

  getNodeIds(displays: TDisplayType[]) {
    return displays.reduce((ids: string[], display: TDisplayType) => {
      const nodeMap = this.state.nodeMaps[display];
      const aggregatedIds = Object.values(nodeMap).concat(ids);

      return aggregatedIds;
    }, []);
  }

  getPlatformDisplay(platform: TPlatform) {
    return this.state.platformSettings[platform].display;
  }

  getPlatformContext(platform: TPlatform) {
    const display = this.getPlatformDisplay(platform);
    return this.videoSettingsService.contexts[display];
  }

  getDisplayNodeMap(display: TDisplayType) {
    return this.state.nodeMaps[display];
  }

  getDisplayNodeId(defaultNodeId: string) {
    return this.state.sceneNodeMaps[this.scenesService.views.activeSceneId][defaultNodeId];
  }

  getDisplayNodeVisibility(defaultNodeId: string, display?: TDisplayType) {
    if (display === 'horizontal') {
      return this.scenesService.views.getNodeVisibility(defaultNodeId);
    } else {
      const nodeId = this.getDisplayNodeId(defaultNodeId);
      return this.scenesService.views.getNodeVisibility(nodeId);
    }
  }

  getGreenNodeIds(sceneItemId: string) {
    return [
      this.state.nodeMaps['horizontal'][sceneItemId],
      this.state.nodeMaps['green'][sceneItemId],
    ];
  }

  getPlatformContextName(platform: TPlatform): TOutputOrientation {
    return this.getPlatformDisplay(platform) === 'horizontal' ? 'landscape' : 'portrait';
  }
}

@InitAfter('UserService')
@InitAfter('ScenesService')
@InitAfter('SceneCollectionsService')
@InitAfter('VideoSettingsService')
export class GreenService extends PersistentStatefulService<IGreenServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private videoSettingsService: VideoSettingsService;

  static defaultState: IGreenServiceState = {
    displays: ['horizontal', 'green'],
    platformSettings: GreenPlatformSettings,
    greenMode: false,
    nodeMaps: null,
    sceneNodeMaps: {},
  };

  sceneItemsConfirmed = new Subject();
  sceneItemsDestroyed = new Subject();

  get views() {
    return new GreenViews(this.state);
  }

  init() {
    super.init();

    // this.sceneCollectionsService.collectionInitialized.subscribe(() => {
    //   if (
    //     this.scenesService.views.getSceneItemsBySceneId(this.scenesService.views.activeSceneId)
    //       .length > 0
    //   ) {
    //     this.confirmOrCreateGreenNodes();
    //   }
    // });

    // this.sceneCollectionsService.collectionSwitched.subscribe(() => {
    //   if (
    //     this.scenesService.views.getSceneItemsBySceneId(this.scenesService.views.activeSceneId)
    //       .length > 0
    //   ) {
    //     this.confirmOrCreateGreenNodes();
    //   }
    // });

    // this.scenesService.sceneAdded.subscribe((scene: IScene) => {
    //   if (this.videoSettingsService.contexts.green) {
    //     this.assignSceneNodes(scene.id);
    //   }
    // });

    // this.scenesService.sceneSwitched.subscribe((scene: IScene) => {
    //   if (this.scenesService.views.getSceneItemsBySceneId(scene.id).length > 0) {
    //     this.confirmOrCreateGreenNodes(scene.id);
    //   }
    // });
  }

  /**
   * Create or confirm nodes for green output when toggling green display
   */

  confirmOrCreateGreenNodes(sceneId?: string) {
    if (
      !this.state.sceneNodeMaps.hasOwnProperty(sceneId ?? this.scenesService.views.activeSceneId)
    ) {
      try {
        this.mapSceneNodes(this.views.displays);
      } catch (error: unknown) {
        console.error('Error toggling Green mode: ', error);
      }
    } else {
      try {
        this.assignSceneNodes();
      } catch (error: unknown) {
        console.error('Error toggling Green mode: ', error);
      }
    }

    if (!this.videoSettingsService.contexts.green) {
      this.videoSettingsService.establishVideoContext('green');
    }

    this.sceneItemsConfirmed.next();
  }

  assignSceneNodes(sceneId?: string) {
    const activeSceneId = this.scenesService.views.activeSceneId;
    const sceneItems = this.scenesService.views.getSceneItemsBySceneId(sceneId ?? activeSceneId);
    const greenNodeIds = this.views.greenNodeIds;

    if (!this.videoSettingsService.contexts.green) {
      this.videoSettingsService.establishVideoContext('green');
    }

    sceneItems.forEach(sceneItem => {
      const context = greenNodeIds.includes(sceneItem.id) ? 'green' : 'horizontal';
      this.assignNodeContext(sceneItem, context);
    });
  }

  mapSceneNodes(displays: TDisplayType[], sceneId?: string) {
    const sceneToMapId = sceneId ?? this.scenesService.views.activeSceneId;
    return displays.reduce((created: boolean, display: TDisplayType, index) => {
      const isFirstDisplay = index === 0;
      if (!this.videoSettingsService.contexts[display]) {
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

      // @@@ TODO: Remove
      // create a node map entry even though the key and value are the same
      this.SET_NODE_MAP_ITEM(display, sceneItem.id, sceneItem.id, sceneId);
      return sceneItem.id;
    } else {
      // if it's not the first display, copy the scene item
      const scene = this.scenesService.views.getScene(sceneId);
      const copiedSceneItem = scene.addSource(sceneItem.sourceId);
      const context = this.videoSettingsService.contexts[display];

      if (!copiedSceneItem || !context) return null;

      const settings: IPartialSettings = { ...sceneItem.getSettings(), output: context };
      copiedSceneItem.setSettings(settings);

      const reorderNodesSubcommand = new ReorderNodesCommand(
        scene.getSelection(copiedSceneItem.id),
        sceneItem.id,
        EPlaceType.Before,
      );
      reorderNodesSubcommand.execute();

      this.SET_NODE_MAP_ITEM(display, sceneItem.id, copiedSceneItem.id, sceneId);
      return sceneItem.id;
    }
  }

  assignNodeContext(sceneItem: SceneItem, display: TDisplayType) {
    const context = this.videoSettingsService.contexts[display];
    if (!context) return null;

    sceneItem.setSettings({ output: context });
    return sceneItem.id;
  }

  restoreScene(display: TDisplayType) {
    if (this.state.nodeMaps) {
      const nodesMap = this.state.nodeMaps[display];
      const nodesToReassign = Object.keys(nodesMap);

      const sceneNodes = this.scenesService.views.getSceneItemsBySceneId(
        this.scenesService.views.activeSceneId,
      );

      const horizontalContext = this.videoSettingsService.contexts.horizontal;

      sceneNodes.forEach((sceneItem: SceneItem) => {
        if (nodesToReassign.includes(sceneItem.id)) {
          const setting: IPartialSettings = { output: horizontalContext };
          sceneItem.setSettings(setting);
        } else {
          sceneItem.remove();
        }
      });
    }

    this.videoSettingsService.resetToDefaultContext();

    this.state.nodeMaps = null;
  }

  /**
   * Helper functions for adding and removing scene items in Green mode
   */

  removeGreenNodes(nodeId: string) {
    this.REMOVE_DUAL_OUTPUT_NODES(nodeId);
  }

  restoreNodesToMap(sceneItemId: string, greenSceneItemId: string) {
    this.SET_NODE_MAP_ITEM('horizontal', sceneItemId, sceneItemId);
    this.SET_NODE_MAP_ITEM('green', sceneItemId, greenSceneItemId);
  }

  /**
   * Settings for platforms to displays
   */

  updatePlatformSetting(platform: TPlatform | string, display: TGreenDisplayType) {
    this.UPDATE_PLATFORM_SETTING(platform, display);
  }

  @mutation()
  private UPDATE_PLATFORM_SETTING(platform: TPlatform | string, display: TGreenDisplayType) {
    this.state.platformSettings[platform] = {
      ...this.state.platformSettings[platform],
      display,
    };
  }

  @mutation()
  private TOGGLE_DUAL_OUTPUT_MODE(status: boolean) {
    this.state.greenMode = status;
  }

  @mutation()
  private SET_EMPTY_NODE_MAP(display: TDisplayType) {
    if (!this.state.nodeMaps) {
      this.state.nodeMaps = {};
    }
    this.state.nodeMaps[display] = {};
  }

  @mutation()
  private SET_NODE_MAP_ITEM(
    display: TDisplayType,
    originalSceneNodeId: string,
    copiedSceneNodeId: string,
    sceneId?: string,
  ) {
    // @@@ TODO Remove
    if (!this.state.nodeMaps) {
      this.state.nodeMaps = {};
    }
    this.state.nodeMaps[display] = {
      ...this.state.nodeMaps[display],
      [originalSceneNodeId]: copiedSceneNodeId,
    };

    if (display === 'green') {
      this.state.sceneNodeMaps[sceneId] = {
        ...this.state.sceneNodeMaps[sceneId],
        [originalSceneNodeId]: copiedSceneNodeId,
      };
    }
  }

  @mutation()
  private REMOVE_DUAL_OUTPUT_NODES(nodeId: string) {
    // remove nodes from scene

    let newMap = {};
    for (const display in this.state.nodeMaps) {
      newMap = {
        ...newMap,
        [display]: Object.entries(this.state.nodeMaps[display]).filter(
          ([key, val]) => key !== nodeId,
        ),
      };
    }
    this.state.nodeMaps = newMap;
  }
}
