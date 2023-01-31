import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDualOutputPlatformSettings,
  DualOutputPlatformSettings,
  EDualOutputPlatform,
  TDualOutputDisplayType,
  IDualOutputPlatformSetting,
} from './dual-output-data';
import { ScenesService, SceneItem } from 'services/scenes';
import { TDisplayType, VideoSettingsService } from 'services/settings-v2/video';
import { SceneCollectionsService } from 'services/scene-collections';
import { RemoveItemCommand } from 'services/editor-commands/commands';
import { TPlatform } from 'services/platforms';

interface IDualOutputServiceState {
  platformSettings: TDualOutputPlatformSettings;
  dualOutputMode: boolean;
  nodeMaps: { [display in TDisplayType as string]: Dictionary<string> };
}

class DualOutputViews extends ViewHandler<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;

  get dualOutputMode() {
    return this.state.dualOutputMode;
  }

  get platformSettings() {
    return this.state.platformSettings;
  }

  get platformSettingsList(): IDualOutputPlatformSetting[] {
    return Object.values(this.state.platformSettings);
  }

  get hasDualOutputScenes() {
    return (
      this.state.nodeMaps &&
      this.state.nodeMaps.hasOwnProperty('horizontal') &&
      this.state.nodeMaps.hasOwnProperty('vertical')
    );
  }

  get showDualOutputDisplays() {
    return this.state.dualOutputMode && this.hasDualOutputScenes;
  }

  getPlatformDisplay(platform: TPlatform) {
    return this.state.platformSettings[platform].setting;
  }

  getDisplayNodeMap(display: TDisplayType) {
    return this.state.nodeMaps[display];
  }

  getDisplayNodeId(display: TDisplayType, defaultNodeId: string) {
    return this.state.nodeMaps[display][defaultNodeId];
  }

  getDisplayNodeVisibility(display: TDisplayType, defaultNodeId: string) {
    const nodeId = this.getDisplayNodeId(display, defaultNodeId);
    return this.scenesService.views.getNodeVisibility(nodeId);
  }
}

@InitAfter('UserService')
@InitAfter('ScenesService')
@InitAfter('SceneCollectionsService')
@InitAfter('VideoSettingsService')
export class DualOutputService extends PersistentStatefulService<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private videoSettingsService: VideoSettingsService;

  static defaultState: IDualOutputServiceState = {
    platformSettings: DualOutputPlatformSettings,
    dualOutputMode: false,
    nodeMaps: null,
  };

  get views() {
    return new DualOutputViews(this.state);
  }

  init() {
    super.init();

    this.sceneCollectionsService.collectionInitialized.subscribe(() => {
      if (this.state.dualOutputMode) {
        this.mapSceneNodes(['horizontal', 'vertical']);
      }
    });

    this.scenesService.sceneRemoved.subscribe(() => {
      if (this.state.dualOutputMode) {
        this.destroySceneNodes(['horizontal', 'vertical']);
      }
    });

    this.scenesService.sceneSwitched.subscribe(() => {
      if (this.state.dualOutputMode && this.views.hasDualOutputScenes) {
        this.destroySceneNodes(['horizontal', 'vertical']);
        this.mapSceneNodes(['horizontal', 'vertical'], this.scenesService.views.activeSceneId);
      }
    });
  }

  async toggleDualOutputMode(status: boolean) {
    try {
      if (!status) {
        const destroyed = this.destroySceneNodes(['horizontal', 'vertical']);
        if (destroyed) {
          console.log('this.state.nodeMaps ', this.state.nodeMaps);
          this.TOGGLE_DUAL_OUTPUT_MODE(status);
          return true;
        }
      } else {
        const created = this.mapSceneNodes(['horizontal', 'vertical']);
        if (created) {
          console.log('this.state.nodeMaps ', this.state.nodeMaps);
          this.TOGGLE_DUAL_OUTPUT_MODE(status);
          return true;
        }
      }
      return false;
    } catch (error: unknown) {
      console.error('Error toggling Dual Output mode: ', error);
      return false;
    }
  }

  mapSceneNodes(displays: TDisplayType[], sceneId?: string) {
    const sceneToMapId = sceneId ?? this.scenesService.views.activeSceneId;
    return displays.reduce((created: boolean, display: TDisplayType, index) => {
      const isFirstDisplay = index === 0;
      this.videoSettingsService.establishVideoContext(display);
      const nodesCreated = this.createOutputNodes(sceneToMapId, display, isFirstDisplay);
      console.log('nodesCreated ', nodesCreated);
      if (!nodesCreated) {
        created = false;
      }
      return created;
    }, true);
  }

  createOutputNodes(sceneId: string, display: TDisplayType, isFirstDisplay: boolean) {
    const sceneNodes = this.scenesService.views.getSceneItemsBySceneId(sceneId);
    console.log('sceneNodes ', sceneNodes);
    if (!sceneNodes) return false;
    return sceneNodes.reduce((created: boolean, sceneItem: SceneItem) => {
      const nodeCreated = this.createOrAssignOutputNode(
        sceneItem,
        display,
        isFirstDisplay,
        sceneId,
      );
      console.log('nodeCreated ', nodeCreated);
      if (!nodeCreated) {
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
      const context = this.videoSettingsService.contexts[display];
      console.log('context ', context);

      if (!context) return false;

      sceneItem.output = context;
      // in preparation for unlimited display profiles
      // create a node map entry even though the key and value are the same
      this.SET_NODE_MAP_ITEM(display, sceneItem.id, sceneItem.id);
      return true;
    } else {
      // if it's not the first display, copy the scene item
      const scene = this.scenesService.views.getScene(sceneId);
      const copiedSceneItem = scene.addSource(sceneItem.sourceId);

      if (!copiedSceneItem) return false;

      copiedSceneItem.setSettings(sceneItem.getSettings());
      this.SET_NODE_MAP_ITEM(display, sceneItem.id, copiedSceneItem.id);
      return true;
    }
  }

  destroySceneNodes(displays: TDisplayType[]) {
    return displays.reduce((destroyed: boolean, display: TDisplayType, index) => {
      const isFirstDisplay = index === 0;
      const sceneNodesDestroyed = this.destroySceneNodesByNodeMap(display, isFirstDisplay);
      if (!sceneNodesDestroyed) {
        destroyed = false;
      }
      const contextDestroyed = this.videoSettingsService.destroyVideoContext(display);
      if (!contextDestroyed) {
        destroyed = false;
      }
      return destroyed;
    }, true);
  }

  destroySceneNodesByNodeMap(display: TDisplayType, isFirstDisplay: boolean) {
    const displayNodeIds = Object.keys(this.state.nodeMaps[display as string]);
    if (!displayNodeIds) return false;
    if (isFirstDisplay) {
      // if it's the first dual output display
      // assign the scene item output to the default display
      const resetSceneItemOutput = displayNodeIds.reduce((reset: boolean, sceneNodeId: string) => {
        const node = this.scenesService.views.getSceneItem(sceneNodeId);
        if (!node) {
          reset = false;
        } else {
          node.output = this.videoSettingsService.contexts.default;
        }
        return reset;
      }, true);
      if (!resetSceneItemOutput) return false;
    } else {
      displayNodeIds.forEach(sceneNodeId => {
        const removeItemCommand = new RemoveItemCommand(sceneNodeId);
        removeItemCommand.execute();
      });
    }
    this.DESTROY_DISPLAY_NODE_MAP(display);
    return true;
  }

  shutdown() {
    if (this.state.dualOutputMode) {
      try {
        this.destroySceneNodes(['horizontal', 'vertical']);
      } catch (error: unknown) {
        console.error('Error shutting down Dual Output Service ', error);
      }
    }
  }

  updatePlatformSetting(platform: EDualOutputPlatform | string, setting: TDualOutputDisplayType) {
    this.UPDATE_PLATFORM_SETTING(platform, setting);
  }

  @mutation()
  private UPDATE_PLATFORM_SETTING(
    platform: EDualOutputPlatform | string,
    setting: TDualOutputDisplayType,
  ) {
    this.state.platformSettings[platform] = {
      ...this.state.platformSettings[platform],
      setting,
    };
  }

  @mutation()
  private TOGGLE_DUAL_OUTPUT_MODE(status: boolean) {
    this.state.dualOutputMode = status;
  }

  @mutation()
  private SET_NODE_MAP_ITEM(
    display: TDisplayType,
    originalSceneNodeId: string,
    copiedSceneNodeId: string,
  ) {
    if (!this.state.nodeMaps) {
      this.state.nodeMaps = {};
      this.state.nodeMaps[display] = {
        [originalSceneNodeId]: copiedSceneNodeId,
      };
    } else {
      this.state.nodeMaps[display] = {
        ...this.state.nodeMaps[display],
        [originalSceneNodeId]: copiedSceneNodeId,
      };
    }
  }

  @mutation()
  private DESTROY_DISPLAY_NODE_MAP(display: TDisplayType) {
    const { nodeMaps } = this.state;
    if (Object.keys(nodeMaps).length === 1) {
      // if there is only one nodeMap, reset the nodeMaps property
      this.state.nodeMaps = null;
    } else {
      delete nodeMaps[display];
      this.state.nodeMaps = { ...nodeMaps };
    }
  }
}
