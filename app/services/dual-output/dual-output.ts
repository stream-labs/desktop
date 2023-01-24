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
import { TDisplayType, VideoSettingsService } from 'services/settings-v2/video';
import { CopyNodesCommand } from 'services/editor-commands/commands';
import { TPlatform } from 'services/platforms';
import * as obs from '../../../obs-api';

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
  horizontalScene: obs.IScene;
  verticalScene: obs.IScene;
  horizontalNodeMap: Dictionary<string>;
  verticalNodeMap: Dictionary<string>;
  horizontalNodes: TSceneNode[];
  verticalNodes: TSceneNode[];
}

class DualOutputViews extends ViewHandler<IDualOutputServiceState> {
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
    return !!this.state.horizontalScene && !!this.state.verticalScene;
  }

  get showDualOutputDisplays() {
    return this.state.dualOutputMode && !!this.state.horizontalScene && !!this.state.verticalScene;
  }

  get hasNodeMaps() {
    return this.state.horizontalNodeMap && this.state.verticalNodeMap;
  }

  getPlatformDisplay(platform: TPlatform) {
    return this.state.platformSettings[platform].setting;
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
@InitAfter('VideoSettingsService')
export class DualOutputService extends PersistentStatefulService<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private videoSettingsService: VideoSettingsService;

  static defaultState: IDualOutputServiceState = {
    platformSettings: DualOutputPlatformSettings,
    dualOutputMode: false,
    horizontalSceneId: null,
    verticalSceneId: null,
    horizontalScene: null as obs.IScene,
    verticalScene: null as obs.IScene,
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
        this.createOutputScenes(['horizontal', 'vertical']);
      }
    });

    this.scenesService.sceneRemoved.subscribe(() => {
      if (this.state.dualOutputMode) {
        this.destroyOutputScenes(['horizontal', 'vertical']);
      }
    });

    this.scenesService.sceneSwitched.subscribe(() => {
      if (this.state.dualOutputMode) {
        this.destroyOutputScenes(['horizontal', 'vertical']);
        this.createOutputScenes(['horizontal', 'vertical'], this.scenesService.views.activeSceneId);
      }
    });
  }

  async toggleDualOutputMode(status: boolean) {
    try {
      if (!status) {
        const destroyed = this.destroyOutputScenes(['horizontal', 'vertical']);
        if (destroyed) {
          this.TOGGLE_DUAL_OUTPUT_MODE(status);
          return true;
        }
      } else {
        const created = this.createOutputScenes(['horizontal', 'vertical']);
        if (created) {
          this.TOGGLE_DUAL_OUTPUT_MODE(status);
          return true;
        }
      }
    } catch (error: unknown) {
      console.error('Error toggling Dual Output mode: ', error);
      return false;
    }
    return false;
  }

  updatePlatformSetting(platform: EDualOutputPlatform | string, setting: TDualOutputDisplayType) {
    this.UPDATE_PLATFORM_SETTING(platform, setting);
  }

  createOutputScenes(displays: TDisplayType[], sceneId?: string) {
    return displays.reduce((created: boolean, display: TDisplayType) => {
      const contextEstablished = this.videoSettingsService.establishVideoContext(display);
      const sceneCreated = this.createOutputScene(display, sceneId);

      if (!contextEstablished || !sceneCreated) {
        created = false;
      }

      return created;
    }, true);
  }

  createOutputScene(display: TDisplayType, changedSceneId?: string) {
    const sceneId = changedSceneId ?? this.scenesService.views.activeSceneId;
    const scene = obs.SceneFactory.fromName(sceneId);

    // if obs does not return a scene, we should not toggle on dual output
    if (!scene) return false;

    const obsSceneItems = scene.getItems();

    obsSceneItems.forEach(sceneItem => {
      // create source using input factory
      const source = obs.InputFactory.create(
        sceneItem.source.id,
        sceneItem.source.name,
        sceneItem.source.settings,
      );

      scene.add(source);
      sceneItem.video = this.videoSettingsService.contexts[display];

      // @@@ TODO: set scene item settings according to persisted settings. For now, just set to visible
      sceneItem.visible = true;
    });

    this.SET_DUAL_OUTPUT_SCENE(display, scene);

    const sceneName = `${display}Scene`;

    return !!this.state[sceneName];
  }

  destroyOutputScenes(displays: TDisplayType[]) {
    return displays.reduce((destroyed: boolean, display: TDisplayType) => {
      const contextDestroyed = this.videoSettingsService.destroyVideoContext(display);
      const sceneReset = this.resetScene(display);

      if (!contextDestroyed || !sceneReset) {
        destroyed = false;
      }

      return destroyed;
    }, true);
  }

  resetScene(display: TDisplayType) {
    const sceneName = `${display}Scene`;
    const scene: obs.IScene = this.state[sceneName];

    const obsSceneItems = scene.getItems();
    obsSceneItems.forEach((sceneItem: obs.ISceneItem) => {
      sceneItem.source.release();
      sceneItem.remove();
    });

    scene.release();

    this.RESET_SCENE(display);

    return !this.state[sceneName];
  }

  shutdown() {
    if (this.state.dualOutputMode) {
      try {
        this.destroyOutputScenes(['horizontal', 'vertical']);
      } catch (error: unknown) {
        console.error('Error shutting down Dual Output Service ', error);
      }
    }
  }

  @mutation()
  private TOGGLE_DUAL_OUTPUT_MODE(status: boolean) {
    this.state.dualOutputMode = status;
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
  private SET_DUAL_OUTPUT_SCENE(display: TDisplayType, scene: obs.IScene) {
    this.state[`${display}Scene`] = scene;
  }

  @mutation()
  private RESET_SCENE(display: TDisplayType) {
    this.state[`${display}Scene`] = null as obs.IScene;
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

  // destroyDualOutputScenes() {
  //   if (this.views.hasDualOutputScenes) {
  // remove dual output scenes
  // this.scenesService.removeScene(this.state.horizontalSceneId, true);
  // this.scenesService.removeScene(this.state.verticalSceneId, true);
  // reset data for dual output scenes
  //   this.resetDualOutputDisplays();
  // }
  // @@@ TODO: remove all scene items on scenes before releasing scene
  // }

  // resetDualOutputDisplays() {
  //   // this.REMOVE_DUAL_OUTPUT_SCENES();
  //   this.RESET_NODE_MAPS();
  // }

  // @mutation()
  // private REMOVE_DUAL_OUTPUT_SCENES() {
  //   this.state.horizontalSceneId = null;
  //   this.state.verticalSceneId = null;
  // }

  // @mutation()
  // private SET_DUAL_OUTPUT_SCENES(horizontalSceneId: string, verticalSceneId: string) {
  //   this.state.horizontalSceneId = horizontalSceneId;
  //   this.state.verticalSceneId = verticalSceneId;
  // }

  // async setDualOutputScenes(sceneId: string) {
  //   if (this.views.hasDualOutputScenes) {
  //     // For performance, we only want one set of dual output scenes active at any time
  //     // so when the user changes the active scene, we destroy the dual output scenes.

  //     // Determine if this is a change in the active scene
  //     // We only need to check one of the dual output scene ids
  //     // because they are created at the same time from the same active scene.
  //     const lastIndex = this.state.horizontalSceneId.lastIndexOf('_');
  //     this.state.horizontalSceneId.slice(0, lastIndex - 2);
  //     const currentSceneId = this.state.horizontalSceneId.slice(0, lastIndex - 2);

  //     if (currentSceneId === sceneId) {
  //       return;
  //     } else {
  //       this.destroyDualOutputScenes();
  //     }
  //   }

  //   // get active scene nodes
  //   const activeScene = this.scenesService.views.getScene(sceneId);
  //   console.log('activeScene ', activeScene.getObsScene());
  //   const nodesToCopy = activeScene.getSelection().selectAll();

  //   // create scenes
  //   const horizontalScene = this.scenesService.createScene(`${sceneId}_horizontal`, {
  //     duplicateSourcesFromScene: activeScene.id,
  //     sceneId: `${sceneId}_horizontal`,
  //     makeActive: false,
  //   });
  //   const verticalScene = this.scenesService.createScene(`${sceneId}_vertical`, {
  //     duplicateSourcesFromScene: activeScene.id,
  //     sceneId: `${sceneId}_vertical`,
  //     makeActive: false,
  //   });

  //   console.log('horizontalScene ', horizontalScene.getObsScene());
  //   console.log('verticalScene ', verticalScene.getObsScene());

  //   /**
  //    * @@@ TODO: determine how different sources are or are not shared
  //    * to determine if the dual output scenes need to have their own sources created for certain scene items
  //    */

  //   // copy nodes from active scene
  //   const horizontalCopyNodesCommand = new CopyNodesCommand(nodesToCopy, horizontalScene.state.id);
  //   horizontalCopyNodesCommand.execute();
  //   const verticalCopyNodesCommand = new CopyNodesCommand(nodesToCopy, verticalScene.state.id);
  //   verticalCopyNodesCommand.execute();

  //   // update state
  //   this.SET_NODE_MAPS(horizontalCopyNodesCommand.idsMap, verticalCopyNodesCommand.idsMap);

  //   if (!this.state.dualOutputMode && this.videoSettingsService.additionalContextsExist) {
  //     this.TOGGLE_DUAL_OUTPUT_MODE(true);
  //   }
  //   this.SET_DUAL_OUTPUT_SCENES(horizontalScene.state.id, verticalScene.state.id);
  // }

  // @@@ TODO: map nodes
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
