import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDualOutputPlatformSettings,
  DualOutputPlatformSettings,
  EDualOutputPlatform,
  EOutputDisplayType,
  TDualOutputDisplayType,
  IDualOutputPlatformSetting,
} from './dual-output-data';
import { ScenesService, TSceneNode } from 'services/scenes';
import { SceneCollectionsService } from 'services/scene-collections';
import { CopyNodesCommand } from 'services/editor-commands/commands';

// @@@ TODO: Refactor dictionaries to Dictionary<<Record<string, TSceneNode>> to allow for multiple settings profiles?
interface IDualOutputNodeIds {
  horizontal: string;
  vertical: string;
}
interface IDualOutputServiceState {
  platformSettings: TDualOutputPlatformSettings;
  dualOutputMode: boolean;
  horizontalSceneId: string;
  verticalSceneId: string;
  horizontalNodeMap: Dictionary<string>;
  verticalNodeMap: Dictionary<string>;
  horizontalNodes: TSceneNode[];
  verticalNodes: TSceneNode[];
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

  get horizontalSceneId() {
    return this.state.horizontalSceneId;
  }

  get verticalSceneId() {
    return this.state.verticalSceneId;
  }

  get horizontalScene() {
    return this.getServiceViews(ScenesService).getScene(this.state.horizontalSceneId);
  }

  get verticalScene() {
    return this.getServiceViews(ScenesService).getScene(this.state.verticalSceneId);
  }

  get hasDualOutputScenes() {
    return this.state.horizontalSceneId && this.state.verticalSceneId;
  }

  get hasNodeMaps() {
    return this.state.horizontalNodeMap && this.state.verticalNodeMap;
  }

  getHorizontalNodeId(activeSceneNodeId: string) {
    return this.hasNodeMaps && this.state.horizontalNodeMap[activeSceneNodeId];
  }

  getVerticalNodeId(activeSceneNodeId: string) {
    return this.hasNodeMaps && this.state.verticalNodeMap[activeSceneNodeId];
  }
}

@InitAfter('UserService')
@InitAfter('ScenesService')
@InitAfter('SourcesService')
@InitAfter('SceneCollectionsService')
export class DualOutputService extends PersistentStatefulService<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;

  static defaultState: IDualOutputServiceState = {
    platformSettings: DualOutputPlatformSettings,
    dualOutputMode: false,
    horizontalSceneId: null,
    verticalSceneId: null,
    horizontalNodeMap: null,
    verticalNodeMap: null,
    horizontalNodes: null,
    verticalNodes: null,
  };

  get views() {
    return new DualOutputViews(this.state);
  }

  init() {
    super.init();

    this.sceneCollectionsService.collectionInitialized.subscribe(() => {
      if (this.state.dualOutputMode) {
        this.setDualOutputScenes(this.scenesService.views.activeSceneId);
      }
    });

    this.scenesService.sceneRemoved.subscribe(() => {
      if (this.state.dualOutputMode) {
        this.destroyDualOutputScenes();
      }
    });

    this.scenesService.sceneSwitched.subscribe(scene => {
      if (this.state.dualOutputMode) {
        this.setDualOutputScenes(this.scenesService.views.activeSceneId);
      }
    });
  }

  toggleDualOutputMode(status?: boolean) {
    this.TOGGLE_DUAL_OUTPUT_MODE(status);
  }

  updatePlatformSetting(platform: EDualOutputPlatform | string, setting: TDualOutputDisplayType) {
    this.UPDATE_PLATFORM_SETTING(platform, setting);
  }

  async setDualOutputScenes(sceneId: string) {
    if (this.views.hasDualOutputScenes) {
      // For performance, we only want one set of dual output scenes active at any time
      // so when the user changes the active scene, we destroy the dual output scenes.

      // Determine if this is a change in the active scene
      // We only need to check one of the dual output scene ids
      // because they are created at the same time from the same active scene.
      const lastIndex = this.state.horizontalSceneId.lastIndexOf('_');
      this.state.horizontalSceneId.slice(0, lastIndex - 2);
      const currentSceneId = this.state.horizontalSceneId.slice(0, lastIndex - 2);

      if (currentSceneId === sceneId) {
        return;
      } else {
        this.destroyDualOutputScenes();
      }
    }

    // get active scene nodes
    const activeScene = this.scenesService.views.getScene(sceneId);
    const nodesToCopy = activeScene.getSelection().selectAll();

    // create scenes
    const horizontalScene = this.scenesService.createScene(`${sceneId}_horizontal`, {
      duplicateSourcesFromScene: activeScene.id,
      sceneId: `${sceneId}_horizontal`,
      makeActive: false,
    });
    const verticalScene = this.scenesService.createScene(`${sceneId}_vertical`, {
      duplicateSourcesFromScene: activeScene.id,
      sceneId: `${sceneId}_vertical`,
      makeActive: false,
    });

    /**
     * @@@ TODO: determine how different sources are or are not shared
     * to determine if the dual output scenes need to have their own sources created for certain scene items
     */

    // copy nodes from active scene
    const horizontalCopyNodesCommand = new CopyNodesCommand(nodesToCopy, horizontalScene.state.id);
    horizontalCopyNodesCommand.execute();
    const verticalCopyNodesCommand = new CopyNodesCommand(nodesToCopy, verticalScene.state.id);
    verticalCopyNodesCommand.execute();

    // update state
    this.SET_NODE_MAPS(horizontalCopyNodesCommand.idsMap, verticalCopyNodesCommand.idsMap);

    if (!this.state.dualOutputMode) {
      this.toggleDualOutputMode(true);
    }
    this.SET_DUAL_OUTPUT_SCENES(horizontalScene.state.id, verticalScene.state.id);
  }

  attachNodesToMap(nodes: TSceneNode[], nodeMap: Dictionary<string>) {
    return nodes.reduce((mappedNodes, node) => {
      const id = Object.keys(nodeMap).find(key => nodeMap[key] === node.id);
      return { ...mappedNodes, [id]: { [node.id]: node } };
    }, {});
  }

  setNodeMap(sceneId: string, nodeMap: Dictionary<string>) {
    this.SET_NODE_MAP(sceneId, nodeMap);
  }

  destroyDualOutputScenes() {
    if (this.views.hasDualOutputScenes) {
      // remove dual output scenes
      this.scenesService.removeScene(this.state.horizontalSceneId, true);
      this.scenesService.removeScene(this.state.verticalSceneId, true);
      // reset data for dual output scenes
      this.resetDualOutputDisplays();
    }
  }

  resetDualOutputDisplays() {
    this.REMOVE_DUAL_OUTPUT_SCENES();
    this.RESET_NODE_MAPS();
  }

  shutdown() {
    this.destroyDualOutputScenes();
  }

  @mutation()
  private TOGGLE_DUAL_OUTPUT_MODE(status?: boolean) {
    if (typeof status === 'undefined') {
      this.state.dualOutputMode = !this.state.dualOutputMode;
    } else {
      this.state.dualOutputMode = status;
    }
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
  private SET_DUAL_OUTPUT_SCENES(horizontalSceneId: string, verticalSceneId: string) {
    this.state.horizontalSceneId = horizontalSceneId;
    this.state.verticalSceneId = verticalSceneId;
  }

  @mutation()
  private REMOVE_DUAL_OUTPUT_SCENES() {
    this.state.horizontalSceneId = null;
    this.state.verticalSceneId = null;
  }

  @mutation()
  private SET_NODE_MAPS(
    horizontalNodeMap?: Dictionary<string>,
    verticalNodeMap?: Dictionary<string>,
  ) {
    if (!horizontalNodeMap || !verticalNodeMap) {
      this.state.horizontalNodeMap = null;
      this.state.verticalNodeMap = null;
    } else {
      this.state.horizontalNodeMap = horizontalNodeMap;
      this.state.verticalNodeMap = verticalNodeMap;
    }
  }

  @mutation()
  private RESET_NODE_MAPS() {
    this.state.horizontalNodeMap = null;
    this.state.verticalNodeMap = null;
  }

  @mutation()
  private SET_NODE_MAP(sceneId: string, nodeMap: Dictionary<string>) {
    const display = sceneId.split('_').pop();

    if (Object.values<string>(EOutputDisplayType).includes(display)) {
      this.state[`${display}NodeMap`] = nodeMap;
    }
  }
}
