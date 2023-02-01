import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDualOutputPlatformSettings,
  DualOutputPlatformSettings,
  EDualOutputPlatform,
  TDualOutputDisplayType,
  IDualOutputPlatformSetting,
} from './dual-output-data';
import { ScenesService, SceneItem, IPartialSettings } from 'services/scenes';
import { TDisplayType, VideoSettingsService } from 'services/settings-v2/video';
import { SceneCollectionsService } from 'services/scene-collections';
import { RemoveItemCommand } from 'services/editor-commands/commands';
import { TPlatform } from 'services/platforms';
import { Subject } from 'rxjs';

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
      (this.state.nodeMaps.hasOwnProperty('horizontal') ||
        this.state.nodeMaps.hasOwnProperty('vertical'))
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

  sceneItemsDestroyed = new Subject();

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
        this.destroySceneNodes(['horizontal', 'vertical'], 'horizontal');
      }
    });

    this.scenesService.sceneSwitched.subscribe(() => {
      if (this.state.dualOutputMode && this.views.hasDualOutputScenes) {
        console.log('switching');
        this.destroySceneNodes(['horizontal', 'vertical'], 'horizontal');
        this.mapSceneNodes(['horizontal', 'vertical'], this.scenesService.views.activeSceneId);
      }
    });
  }

  async toggleDualOutputMode(status: boolean) {
    try {
      if (!status) {
        const destroyed = this.destroySceneNodes(['horizontal', 'vertical'], 'horizontal');

        if (destroyed) {
          this.TOGGLE_DUAL_OUTPUT_MODE(status);
          return true;
        }
      } else {
        const created = this.mapSceneNodes(['horizontal', 'vertical']);
        if (created) {
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
      const nodeCreated = this.createOrAssignOutputNode(
        sceneItem,
        display,
        isFirstDisplay,
        sceneId,
      );
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

      if (!context) return false;

      sceneItem.setSettings({ output: context });

      // in preparation for unlimited display profiles
      // create a node map entry even though the key and value are the same
      this.SET_NODE_MAP_ITEM(display, sceneItem.id, sceneItem.id);
      return true;
    } else {
      // if it's not the first display, copy the scene item
      const scene = this.scenesService.views.getScene(sceneId);
      const copiedSceneItem = scene.addSource(sceneItem.sourceId);
      const context = this.videoSettingsService.contexts[display];

      if (!copiedSceneItem || !context) return false;

      const settings: IPartialSettings = { ...sceneItem.getSettings(), output: context };
      copiedSceneItem.setSettings(settings);

      this.SET_NODE_MAP_ITEM(display, sceneItem.id, copiedSceneItem.id);
      return true;
    }
  }

  destroySceneNodes(displays: TDisplayType[], displayToDefault: TDisplayType) {
    const destroyed = displays.reduce((destroyed: boolean, display: TDisplayType) => {
      const assignToDefault = display === displayToDefault;
      const sceneNodesDestroyed = this.destroySceneNodesByNodeMap(display, assignToDefault);

      if (!sceneNodesDestroyed) {
        destroyed = false;
      } else {
        const contextDestroyed = this.videoSettingsService.destroyVideoContext(display);
        if (!contextDestroyed) {
          destroyed = false;
        }
      }
      return destroyed;
    }, true);
    return this.sceneItemsDestroyed.subscribe(() => destroyed);
  }

  destroySceneNodesByNodeMap(display: TDisplayType, assignToDefault: boolean) {
    const nodeMap = this.state.nodeMaps[display];
    if (!nodeMap) {
      return false;
    }
    const displayNodeIds = Object.keys(nodeMap);
    if (!displayNodeIds) return false;
    if (assignToDefault) {
      // assign scene items to the default context for the default display
      const resetSceneItemOutput = displayNodeIds.reduce((reset: boolean, sceneNodeId: string) => {
        const node = this.scenesService.views.getSceneItem(sceneNodeId);
        if (!node) {
          reset = false;
        } else {
          node.setSettings({ output: this.videoSettingsService.contexts.default });
        }
        return reset;
      }, true);
      if (!resetSceneItemOutput) return false;
    } else {
      displayNodeIds.forEach(sceneNodeId => {
        const node = this.scenesService.views.getSceneItem(sceneNodeId);
        if (!node) return false;
        node.remove();
        // const removeItemCommand = new RemoveItemCommand(sceneNodeId);
        // removeItemCommand.execute();
      });
    }

    if (nodeMap[display]) {
      this.DESTROY_DISPLAY_NODE_MAP(display);
      return true;
    } else {
      return false;
    }
  }

  forceResetOfScene(display: TDisplayType) {
    const nodesMap = this.state.nodeMaps[display];
    const nodesToReassign = Object.keys(nodesMap);

    const { activeSceneId } = this.scenesService.views;

    const sceneNodes = this.scenesService.views.getSceneItemsBySceneId(activeSceneId);

    sceneNodes.forEach((sceneItem: SceneItem) => {
      if (nodesToReassign.includes(sceneItem.id)) {
        const setting: IPartialSettings = { output: this.videoSettingsService.contexts.default };
        sceneItem.setSettings(setting);
      } else {
        sceneItem.remove();
      }
    });
  }

  shutdown() {
    if (this.state.dualOutputMode) {
      try {
        // this.forceResetOfScene('horizontal');
        const destroyed = this.destroySceneNodes(['horizontal', 'vertical'], 'horizontal');

        // if the scene nodes are not successfully removed by iterating over the node maps
        // force the scene to remove all dual output nodes by iterating over the scene items
        if (!destroyed) this.forceResetOfScene('horizontal');
      } catch (error: unknown) {
        console.error('Error shutting down Dual Output Service ', error);
      }
    }

    // if something goes wrong when destroying the scene nodes
    // to prevent errors on startup, always remove the node maps
    // regardless of whether or not the dual output nodes were successfully destroyed
    this.state.nodeMaps = null;
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
      delete this.state.nodeMaps[display];
    }
  }
}
