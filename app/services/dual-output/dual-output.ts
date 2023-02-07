import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDisplayPlatforms,
  TDualOutputPlatformSettings,
  DualOutputPlatformSettings,
  EDualOutputPlatform,
  TDualOutputDisplayType,
  IDualOutputPlatformSetting,
} from './dual-output-data';
import { ScenesService, SceneItem, IPartialSettings } from 'services/scenes';
import { TDisplayType, VideoSettingsService } from 'services/settings-v2/video';
import { StreamingService } from 'services/streaming';
import { SceneCollectionsService } from 'services/scene-collections';
import { TPlatform } from 'services/platforms';
import { Subject } from 'rxjs';

interface IDualOutputServiceState {
  convertedDefaultDisplay: TDisplayType;
  displays: TDisplayType[];
  platformSettings: TDualOutputPlatformSettings;
  dualOutputMode: boolean;
  nodeMaps: { [display in TDisplayType as string]: Dictionary<string> };
}

class DualOutputViews extends ViewHandler<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private videoSettingsService: VideoSettingsService;

  get dualOutputMode() {
    return this.state.dualOutputMode;
  }

  get convertedDefaultDisplay() {
    return this.state.convertedDefaultDisplay;
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

  get dualOutputNodeIds() {
    return this.getNodeIds(['vertical']);
  }

  get displays() {
    return this.state.displays;
  }

  get displayPlatforms() {
    return Object.entries(this.state.platformSettings).reduce(
      (displayPlatforms: TDisplayPlatforms, [key, val]: [string, IDualOutputPlatformSetting]) => {
        if (val) {
          displayPlatforms[val.display].push(val.platform);
        }
        return displayPlatforms;
      },
      { horizontal: [], vertical: [] },
    );
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
  @Inject() private streamingService: StreamingService;

  static defaultState: IDualOutputServiceState = {
    convertedDefaultDisplay: 'horizontal',
    displays: ['horizontal', 'vertical'],
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
        this.setDualOutputMode(false);
      }
    });

    this.scenesService.sceneSwitched.subscribe(() => {
      if (this.state.dualOutputMode && this.views.hasDualOutputScenes) {
        console.log('switching');
        this.restoreScene(this.state.convertedDefaultDisplay);
        this.mapSceneNodes(['horizontal', 'vertical'], this.scenesService.views.activeSceneId);
      }
    });
  }

  async toggleDualOutputMode(status: boolean) {
    try {
      if (!status) {
        this.restoreScene(this.state.convertedDefaultDisplay);
        this.setDualOutputMode(status);
        return true;
      } else {
        const created = this.mapSceneNodes(['horizontal', 'vertical']);
        if (created) {
          this.setDualOutputMode(status);
          return true;
        }
      }
      return false;
    } catch (error: unknown) {
      console.error('Error toggling Dual Output mode: ', error);
      return false;
    }
  }

  setDualOutputMode(status: boolean) {
    this.TOGGLE_DUAL_OUTPUT_MODE(status);
    this.streamingService.actions.setDualOutputMode(!this.streamingService.state.dualOutputMode);
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

      console.log('creating node for ', display, 'context with ', context);

      if (!context) return false;

      sceneItem.setSettings({ output: context }, display);

      // in preparation for unlimited display profiles
      // create a node map entry even though the key and value are the same
      this.SET_NODE_MAP_ITEM(display, sceneItem.id, sceneItem.id);
      return true;
    } else {
      // if it's not the first display, copy the scene item
      const scene = this.scenesService.views.getScene(sceneId);
      const copiedSceneItem = scene.addSource(sceneItem.sourceId);
      const context = this.videoSettingsService.contexts[display];

      console.log('creating node for ', display, 'context with ', context);

      if (!copiedSceneItem || !context) return false;

      const settings: IPartialSettings = { ...sceneItem.getSettings(), output: context };
      copiedSceneItem.setSettings(settings, display);

      this.SET_NODE_MAP_ITEM(display, sceneItem.id, copiedSceneItem.id);
      return true;
    }
  }

  restoreScene(display: TDisplayType) {
    if (this.state.nodeMaps) {
      const nodesMap = this.state.nodeMaps[display];
      const nodesToReassign = Object.keys(nodesMap);

      const sceneNodes = this.scenesService.views.getSceneItemsBySceneId(
        this.scenesService.views.activeSceneId,
      );

      console.log('nodesToReassign ', nodesToReassign);

      console.log('sceneNodes before ', sceneNodes);

      const defaultContext = this.videoSettingsService.contexts.default;

      sceneNodes.forEach((sceneItem: SceneItem) => {
        if (nodesToReassign.includes(sceneItem.id)) {
          console.log('reassigning sceneItem.id ', sceneItem.id);
          const setting: IPartialSettings = { output: defaultContext };
          sceneItem.setSettings(setting, display);

          console.log('model is now', sceneItem.getModel());
        } else {
          console.log('removing ', sceneItem.id);
          sceneItem.remove();
        }
      });

      // @@@ TODO: remove, just confirming correct removal
      const sceneNodes2 = this.scenesService.views.getSceneItemsBySceneId(
        this.scenesService.views.activeSceneId,
      );
      console.log('sceneNodes2 after ', sceneNodes2);
    }

    this.videoSettingsService.resetToDefaultContext();

    this.state.nodeMaps = null;
  }

  updatePlatformSetting(platform: EDualOutputPlatform | string, display: TDualOutputDisplayType) {
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
