import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDisplayPlatforms,
  TGreenPlatformSettings,
  GreenPlatformSettings,
  TGreenDisplayType,
  IGreenPlatformSetting,
} from './green-data';
import { ScenesService, SceneItem, IPartialSettings, IScene } from 'services/scenes';
import {
  TDisplayType,
  VideoSettingsService,
  IVideoSetting,
  greenDisplayData,
} from 'services/settings-v2';
import { StreamingService } from 'services/streaming';
import { SceneCollectionsService } from 'services/scene-collections';
import { TPlatform } from 'services/platforms';
import { ReorderNodesCommand, EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import { Subject } from 'rxjs';
import { TOutputOrientation } from 'services/restream';
import { IVideoInfo } from 'obs-studio-node';

interface IDisplayVideoSettings {
  defaultDisplay: TDisplayType;
  horizontal: IVideoInfo;
  green: IVideoInfo;
  activeDisplays: {
    horizontal: boolean;
    green: boolean;
  };
}
interface IGreenServiceState {
  displays: TDisplayType[];
  platformSettings: TGreenPlatformSettings;
  greenMode: boolean;
  nodeMaps: { [display in TDisplayType as string]: Dictionary<string> };
  sceneNodeMaps: { [sceneId: string]: Dictionary<string> };
  videoSettings: IDisplayVideoSettings;
}

class GreenViews extends ViewHandler<IGreenServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private videoSettingsService: VideoSettingsService;
  @Inject() private streamingService: StreamingService;

  get greenMode(): boolean {
    return this.activeDisplays.horizontal && this.activeDisplays.green;
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

    return Object.values(this.state.sceneNodeMaps[activeSceneId]);
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

  get videoSettings(): IDisplayVideoSettings {
    return this.state.videoSettings;
  }

  get activeDisplays() {
    return this.state.videoSettings.activeDisplays;
  }

  get defaultDisplay() {
    const active = Object.entries(this.state.videoSettings.activeDisplays).map(([key, value]) => {
      if (value === true) {
        return { key };
      }
    });
    return active.length > 1 ? null : active[0];
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
    videoSettings: {
      defaultDisplay: 'horizontal',
      horizontal: null as IVideoInfo,
      green: greenDisplayData, // get settings for horizontal display from obs directly
      activeDisplays: {
        horizontal: true,
        green: false,
      },
    },
  };

  sceneItemsConfirmed = new Subject();
  sceneItemsDestroyed = new Subject();

  get views() {
    return new GreenViews(this.state);
  }

  init() {
    super.init();
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

    sceneItems.forEach(sceneItem => this.assignNodeContext(sceneItem, 'horizontal'));
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

  /**
   * Helper functions to manage displays
   */

  toggleDisplay(status: boolean, display?: TDisplayType) {
    if (
      this.state.videoSettings.activeDisplays.horizontal &&
      this.state.videoSettings.activeDisplays.green
    ) {
      this.setDisplayActive(status, display);
    } else if (display === 'horizontal' && status === false) {
      this.sceneItemsConfirmed.subscribe(() => {
        this.setDisplayActive(status, display);
      });
      this.confirmOrCreateGreenNodes();
    } else if (display === 'green' && status === true) {
      this.sceneItemsConfirmed.subscribe(() => {
        this.setDisplayActive(status, display);
      });
      this.confirmOrCreateGreenNodes();
    } else {
      this.setDisplayActive(status, display);
    }
  }

  setVideoSetting(setting: Partial<IVideoInfo>, display?: TDisplayType) {
    this.SET_VIDEO_SETTING(setting, display);
  }

  private setDisplayActive(status: boolean, display: TDisplayType) {
    this.SET_DISPLAY_ACTIVE(status, display);
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

  @mutation()
  private SET_DISPLAY_ACTIVE(status: boolean, display: TDisplayType = 'horizontal') {
    const otherDisplay = display === 'horizontal' ? 'green' : 'horizontal';
    if (
      status === false &&
      this.state.videoSettings.activeDisplays[display] &&
      !this.state.videoSettings.activeDisplays[otherDisplay]
    ) {
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

    this.state.videoSettings.defaultDisplay = display;
  }

  @mutation()
  private SET_VIDEO_SETTING(setting: Partial<IVideoInfo>, display: TDisplayType = 'green') {
    this.state.videoSettings[display] = {
      ...this.state.videoSettings[display],
      ...setting,
    };
  }
}
