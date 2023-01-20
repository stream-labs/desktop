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
  defaultSource: obs.ISource;
  horizontalSceneId: string;
  verticalSceneId: string;
  horizontalScene: obs.IScene;
  verticalScene: obs.IScene;
  horizontalSource: obs.ISource;
  verticalSource: obs.ISource;
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
    console.log('this.state.horizontalScene ', this.state.horizontalScene);
    console.log('this.state.verticalScene ', this.state.verticalScene);
    return !!this.state.horizontalScene && !!this.state.verticalScene;
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
    defaultSource: null as obs.ISource,
    horizontalSceneId: null,
    verticalSceneId: null,
    horizontalScene: null as obs.IScene,
    verticalScene: null as obs.IScene,
    horizontalSource: null as obs.ISource,
    verticalSource: null as obs.ISource,
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
        this.state.defaultSource = obs.Global.getOutputSource(0);
      }
    });

    this.scenesService.sceneRemoved.subscribe(() => {
      if (this.state.dualOutputMode) {
        this.destroyOutputScenes();
      }
    });

    // this.scenesService.sceneSwitched.subscribe(scene => {
    //   if (this.state.dualOutputMode) {
    //     // @@@ TODO: handle switching scenes
    //     this.destroyOutputScenes();
    //     this.createOutputScenes(['horizontal', 'vertical'], this.scenesService.views.activeSceneId);
    //   }
    // });
  }

  toggleDualOutputMode(status: boolean) {
    if (!status) {
      console.log('destroying');
      // @@@ TODO: Refactor to mirror createOutputScenes logic
      this.videoSettingsService.destroyVideoContext('horizontal');
      this.videoSettingsService.destroyVideoContext('vertical');

      if (!this.videoSettingsService.hasAdditionalContexts) {
        const destroyed = this.destroyOutputScenes();
        if (destroyed) {
          console.log('toggling ', status);
          this.TOGGLE_DUAL_OUTPUT_MODE(status);
          // return true;
        }
      }
    } else {
      const created = this.createOutputScenes(['horizontal', 'vertical']);
      console.log('horizontal ', this.state.horizontalScene);
      console.log('vertical ', this.state.verticalScene);

      if (created) {
        this.TOGGLE_DUAL_OUTPUT_MODE(status);
        // return true;
      }
    }

    // @@@ TODO: frontend error handling for failure to create dual output scenes
    // return false;
  }

  updatePlatformSetting(platform: EDualOutputPlatform | string, setting: TDualOutputDisplayType) {
    this.UPDATE_PLATFORM_SETTING(platform, setting);
  }

  createOutputScenes(displays: TDisplayType[], sceneId?: string) {
    return displays.reduce((created: boolean, display: TDisplayType) => {
      this.videoSettingsService.establishVideoContext(display);

      created = this.createOutputScene(display, sceneId);

      return created;
    }, false);

    // return displays.reduce((created: boolean, display: TDisplayType) => {
    //   this.videoSettingsService.contextCreated.subscribe(displayName => {
    //     console.log('in next');

    //     created = this.createOutputScene(displayName);
    //   });
    //   this.videoSettingsService.establishVideoContext(display);

    //   return created;
    // }, false);
  }

  createOutputScene(display: TDisplayType, changedSceneId?: string) {
    // @@@ TODO: determine how to deal with the output ids
    // for now, just assign horizontal to 0 and vertical to 1
    const outputId = display === 'horizontal' ? 0 : 1;

    const sceneId = changedSceneId ?? this.scenesService.views.activeSceneId;
    const scene = obs.SceneFactory.fromName(sceneId);

    // if obs does not return a scene, we should not toggle on dual output
    if (!scene) return false;

    obs.Global.setOutputSource(outputId, scene);

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

    return true;
  }

  destroyOutputScenes() {
    if (this.state.horizontalScene) {
      console.log('releasing horizontal scene');

      // @@@ HERE, says this.state.defaultSource is an invalid argument?
      obs.Global.setOutputSource(0, this.state.defaultSource);
      // obs.Global.setOutputSource(0, null);

      this.RESET_SCENE('horizontal');
    }
    if (this.state.verticalScene) {
      console.log('releasing vertical scene');

      // @@@ TODO: should this be set to this.state.defaultSource?
      obs.Global.setOutputSource(1, null);

      this.RESET_SCENE('vertical');
    }

    return !(this.state.horizontalScene && this.state.verticalScene);
  }

  shutdown() {
    console.log('shutting down');

    this.destroyOutputScenes();
  }

  @mutation()
  private TOGGLE_DUAL_OUTPUT_MODE(status?: boolean) {
    this.state = { ...this.state, dualOutputMode: status };
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
    const scene: obs.IScene = this.state[`${display}Scene`];

    const obsSceneItems = scene.getItems();

    obsSceneItems.forEach((sceneItem: obs.ISceneItem) => {
      sceneItem.source.release();
      sceneItem.remove();
    });

    scene.release();
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
