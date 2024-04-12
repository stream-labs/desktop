import { PersistentStatefulService, InitAfter, Inject, ViewHandler, mutation } from 'services/core';
import {
  TDualOutputPlatformSettings,
  DualOutputPlatformSettings,
  IDualOutputDestinationSetting,
} from './dual-output-data';
import { verticalDisplayData } from '../settings-v2/default-settings-data';
import { ScenesService, SceneItem, TSceneNode } from 'services/scenes';
import { TDisplayType, VideoSettingsService } from 'services/settings-v2/video';
import { TPlatform } from 'services/platforms';
import { EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import { EditorCommandsService } from 'services/editor-commands';
import { Subject } from 'rxjs';
import { TOutputOrientation } from 'services/restream';
import { IVideoInfo } from 'obs-studio-node';
import { ICustomStreamDestination, StreamSettingsService } from 'services/settings/streaming';
import {
  ISceneCollectionsManifestEntry,
  SceneCollectionsService,
} from 'services/scene-collections';
import { UserService } from 'services/user';
import { SelectionService, Selection } from 'services/selection';
import { StreamingService } from 'services/streaming';
import { SettingsService } from 'services/settings';
import { RunInLoadingMode } from 'services/app/app-decorators';
import compact from 'lodash/compact';
import invert from 'lodash/invert';

interface IDisplayVideoSettings {
  horizontal: IVideoInfo;
  vertical: IVideoInfo;
  activeDisplays: {
    horizontal: boolean;
    vertical: boolean;
  };
}
interface IDualOutputServiceState {
  platformSettings: TDualOutputPlatformSettings;
  destinationSettings: Dictionary<IDualOutputDestinationSetting>;
  dualOutputMode: boolean;
  videoSettings: IDisplayVideoSettings;
  isLoading: boolean;
}

class DualOutputViews extends ViewHandler<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private videoSettingsService: VideoSettingsService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private streamingService: StreamingService;

  get isLoading(): boolean {
    return this.state.isLoading;
  }

  get activeSceneId(): string {
    return this.scenesService.views.activeSceneId;
  }

  get dualOutputMode(): boolean {
    return this.state.dualOutputMode;
  }

  get activeCollection(): ISceneCollectionsManifestEntry {
    return this.sceneCollectionsService.activeCollection;
  }

  get sceneNodeMaps(): { [sceneId: string]: Dictionary<string> } {
    return this.activeCollection?.sceneNodeMaps || {};
  }

  get activeSceneNodeMap(): Dictionary<string> {
    return this.sceneCollectionsService?.sceneNodeMaps?.[this.activeSceneId];
  }

  /**
   * Confirm that an entry exists in the scene collections manifest's scene node map property
   */
  get hasVerticalNodes() {
    return !!this.sceneNodeMaps[this.activeSceneId];
  }

  /**
   * Determines if there are any node maps in the scene collections scene node map property in the
   * scene collections manifest. The existence of the node map in the scene collections manifest
   * shows that the scene collection has been converted to a dual output scene collection. To prevent
   * undefined or null errors from unexpected behavior, confirm that there are any entries in the
   * collection's scene node maps property.
   *
   * Also check to see if dual output mode is active so that a new scene created in dual output mode
   * will correctly create item and show display toggles.
   */
  get hasSceneNodeMaps(): boolean {
    const nodeMaps = this.sceneCollectionsService?.sceneNodeMaps;
    return this.dualOutputMode || (!!nodeMaps && Object.entries(nodeMaps).length > 0);
  }

  get platformSettings() {
    return this.state.platformSettings;
  }

  get destinationSettings() {
    return this.state.destinationSettings;
  }

  get horizontalNodeIds(): string[] {
    if (!this.activeSceneNodeMap) return;

    return Object.keys(this.activeSceneNodeMap);
  }

  get verticalNodeIds(): string[] {
    if (!this.activeSceneNodeMap) return;

    return Object.values(this.activeSceneNodeMap);
  }

  get videoSettings() {
    return this.state.videoSettings;
  }

  get activeDisplays() {
    return this.state.videoSettings.activeDisplays;
  }

  get showHorizontalDisplay() {
    return !this.state.dualOutputMode || (this.activeDisplays.horizontal && !this.state.isLoading);
  }

  get showVerticalDisplay() {
    return this.state.dualOutputMode && this.activeDisplays.vertical && !this.state.isLoading;
  }

  get onlyVerticalDisplayActive() {
    return this.activeDisplays.vertical && !this.activeDisplays.horizontal;
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

  getHorizontalNodeId(verticalNodeId: string, sceneId?: string) {
    const sceneNodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;
    if (!sceneNodeMap) return;

    return Object.keys(sceneNodeMap).find(
      (horizontalNodeId: string) => sceneNodeMap[horizontalNodeId] === verticalNodeId,
    );
  }

  getVerticalNodeId(horizontalNodeId: string, sceneId?: string): string {
    const sceneNodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;
    if (!sceneNodeMap) return;

    return Object.values(sceneNodeMap).find(
      (verticalNodeId: string) => sceneNodeMap[horizontalNodeId] === verticalNodeId,
    );
  }

  getDualOutputNodeId(nodeId: string, sceneId?: string) {
    return this.getHorizontalNodeId(nodeId, sceneId) ?? this.getVerticalNodeId(nodeId, sceneId);
  }

  getVerticalNodeIds(sceneId: string): string[] {
    if (!this.sceneNodeMaps[sceneId]) return;

    return Object.values(this.sceneNodeMaps[sceneId]);
  }

  getNodeDisplay(nodeId: string, sceneId: string) {
    const sceneNodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;

    if (sceneNodeMap && Object.values(sceneNodeMap).includes(nodeId)) {
      return 'vertical';
    }

    // return horizontal by default because if the sceneNodeMap doesn't exist
    // dual output has never been toggled on with this scene active
    return 'horizontal';
  }

  getPlatformContextName(platform?: TPlatform): TOutputOrientation {
    return this.getPlatformDisplay(platform) === 'horizontal' ? 'landscape' : 'portrait';
  }

  getDisplayContextName(display: TDisplayType): TOutputOrientation {
    return display === 'horizontal' ? 'landscape' : 'portrait';
  }

  /**
   * Get the visibility for the vertical node.
   * @remark Primarily used for the source toggles. The id of the node is determined either by the
   * @param nodeId
   * @param sceneId
   * @returns
   */
  getIsHorizontalVisible(nodeId: string, sceneId?: string) {
    if (!this.hasVerticalNodes) return false;
    return this.scenesService.views.getNodeVisibility(nodeId, sceneId ?? this.activeSceneId);
  }

  /**
   * Get the visibility for the vertical node.
   * @remark Primarily used for the source toggles. The id of the node is determined either by the
   * @param nodeId
   * @param sceneId
   * @returns
   */
  getIsVerticalVisible(nodeId: string, sceneId?: string) {
    // in the source selector, the vertical node id is determined by the visible display
    if (!this.hasVerticalNodes) return false;

    const id =
      this.activeDisplays.vertical && !this.activeDisplays.horizontal
        ? nodeId
        : this.activeSceneNodeMap[nodeId];

    return this.scenesService.views.getNodeVisibility(id, sceneId ?? this.activeSceneId);
  }

  getCanStreamDualOutput() {
    const platformDisplays = this.streamingService.views.activeDisplayPlatforms;
    const destinationDisplays = this.streamingService.views.activeDisplayDestinations;

    const horizontalHasDestinations =
      platformDisplays.horizontal.length > 0 || destinationDisplays.horizontal.length > 0;
    const verticalHasDestinations =
      platformDisplays.vertical.length > 0 || destinationDisplays.vertical.length > 0;

    return horizontalHasDestinations && verticalHasDestinations;
  }

  /**
   * Confirm if a scene has a node map for dual output.
   * @remark If the scene collection does not have the scene node maps property in the
   * scene collection manifest, this will return false.
   * @param sceneId Optional id of the scene to look up. If no scene id is provided, the active
   * scene's id will be used.
   * @returns Boolean for whether or not the scene has an entry in the scene collections scene node map.
   */
  hasNodeMap(sceneId?: string): boolean {
    if (!this.sceneCollectionsService?.sceneNodeMaps) return false;
    const nodeMap = sceneId ? this.sceneNodeMaps[sceneId] : this.activeSceneNodeMap;
    return !!nodeMap && Object.keys(nodeMap).length > 0;
  }
}

@InitAfter('ScenesService')
export class DualOutputService extends PersistentStatefulService<IDualOutputServiceState> {
  @Inject() private scenesService: ScenesService;
  @Inject() private videoSettingsService: VideoSettingsService;
  @Inject() private editorCommandsService: EditorCommandsService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private userService: UserService;
  @Inject() private selectionService: SelectionService;
  @Inject() private streamingService: StreamingService;
  @Inject() private settingsService: SettingsService;

  static defaultState: IDualOutputServiceState = {
    platformSettings: DualOutputPlatformSettings,
    destinationSettings: {},
    dualOutputMode: false,
    videoSettings: {
      horizontal: null,
      vertical: verticalDisplayData, // get settings for horizontal display from obs directly
      activeDisplays: {
        horizontal: true,
        vertical: false,
      },
    },
    isLoading: false,
  };

  sceneNodeHandled = new Subject<number>();

  get views() {
    return new DualOutputViews(this.state);
  }

  init() {
    super.init();

    // confirm custom destinations have a default display
    this.confirmDestinationDisplays();

    /**
     * Handle validating or converting dual output scene collections
     * @remark After a dual output scene collection loads, the collection will be validated.
     * After each scene is validated, the node map is set on the scene. This node map property
     * having a value indicates that the scene has been validated.
     */
    this.scenesService.sceneSwitched.subscribe(scene => {
      // do nothing if scene has a node map because this means it has already been validated
      if (scene?.nodeMap) {
        this.setIsLoading(false);
        return;
      }

      // do nothing for single output collections loaded in single output mode
      if (!this.views.activeCollection?.sceneNodeMaps && !this.views.dualOutputMode) {
        this.setIsLoading(false);
        return;
      }

      // convert single output collection loaded in dual output mode
      if (!this.views.activeCollection?.sceneNodeMaps && this.views.dualOutputMode) {
        this.convertSingleOutputToDualOutputCollection();
        this.setIsLoading(false);
        return;
      }

      // confirm dual output collections after loaded (dual output scenes will have node map after loaded)
      if (this.views.activeCollection?.sceneNodeMaps && !scene?.nodeMap) {
        this.confirmOrCreateDualOutputCollection();
        this.setIsLoading(false);
        return;
      }

      if (this.state.isLoading) this.setIsLoading(false);
    });

    /**
     * The user must be logged in to use dual output mode
     * so toggle off dual output mode on log out.
     */
    this.userService.userLogout.subscribe(() => {
      if (this.state.dualOutputMode) {
        this.setdualOutputMode();
      }
    });
  }

  /**
   * Edit dual output display settings
   */

  @RunInLoadingMode()
  setdualOutputMode(status?: boolean) {
    if (!this.userService.isLoggedIn) return;

    this.SET_SHOW_DUAL_OUTPUT(status);

    if (this.state.dualOutputMode) {
      if (!this.views.activeCollection?.sceneNodeMaps) {
        // convert single output collection into a dual output collection
        try {
          this.convertSingleOutputToDualOutputCollection();
        } catch (error: unknown) {
          console.error('Error toggling Dual Output mode: ', error);
        }
      }

      /**
       * Selective recording only works with horizontal sources, so don't show the
       * vertical display if toggling with selective recording active
       */
      if (!this.streamingService.state.selectiveRecording) {
        this.toggleDisplay(true, 'vertical');
      }
    } else {
      this.selectionService.views.globalSelection.reset();
    }

    this.settingsService.showSettings('Video');
  }

  /**
   * Create or confirm nodes for vertical output
   */
  confirmOrCreateDualOutputCollection() {
    if (this.views?.sceneNodeMaps) {
      this.validateDualOutputCollection();
    } else if (this.state.dualOutputMode) {
      this.convertSingleOutputToDualOutputCollection();
    }
    if (this.state.isLoading) this.SET_IS_LOADING(false);
  }

  validateDualOutputCollection() {
    this.SET_IS_LOADING(true);
    // confirm dual output scene collection
    this.scenesService.views.scenes.forEach(scene => {
      if (this.views.sceneNodeMaps[scene.id]) {
        this.confirmSceneNodeMap(scene.id, this.views.sceneNodeMaps[scene.id]);
      } else {
        this.createVerticalNodes(scene.id);
      }
    });
    this.SET_IS_LOADING(false);
  }

  convertSingleOutputToDualOutputCollection() {
    // if in dual output mode, convert the single output collection to dual output
    this.scenesService.views.scenes.forEach(scene => {
      this.createVerticalNodes(scene.id);
    });
  }

  /**
   * Create a vertical node to partner with the vertical node
   * @param horizontalNode - Node to copy to the vertical display
   *
   * @remark The horizontal node id is always the key in the scene node map.
   * The node map entry is so that the horizontal and vertical nodes can refer to each other.
   */
  createVerticalNode(horizontalNode: TSceneNode, verticalNodeId?: string): TSceneNode {
    const scene = horizontalNode.getScene();

    if (horizontalNode.isFolder()) {
      // add folder and create node map entry
      const folder = scene.createFolder(horizontalNode.name, {
        id: verticalNodeId,
        display: 'vertical',
      });
      this.sceneCollectionsService.createNodeMapEntry(scene.id, horizontalNode.id, folder.id);

      this.sceneNodeHandled.next();
      return folder;
    } else {
      // add item
      const item = scene.addSource(horizontalNode.sourceId, {
        id: verticalNodeId,
        display: 'vertical',
      });

      // position all of the nodes in the upper left corner of the vertical display
      // so that all of the sources are visible
      item.setTransform({ position: { x: 0, y: 0 } });

      // show all vertical scene items by default
      item.setVisibility(true);

      // match locked
      item.setLocked(horizontalNode.locked);

      this.sceneCollectionsService.createNodeMapEntry(scene.id, horizontalNode.id, item.id);

      this.sceneNodeHandled.next();
      return item;
    }
  }

  /**
   * Create a horizontal node to partner with the vertical node
   * @param verticalNode - Node to copy to the horizontal display
   *
   * @remark The horizontal node id is always the key in the scene node map.
   * The node map entry is so that the horizontal and vertical nodes can refer to each other.
   */
  createHorizontalNode(
    verticalNode: TSceneNode,
    repair: boolean = false,
    horizontalNodeId?: string,
  ): TSceneNode {
    const scene = verticalNode.getScene();

    if (verticalNode.isFolder()) {
      // add folder and create node map entry
      const folder = scene.createFolder(verticalNode.name, {
        id: horizontalNodeId,
        display: 'horizontal',
      });
      folder.placeBefore(verticalNode.id);

      this.sceneCollectionsService.createNodeMapEntry(scene.id, folder.id, verticalNode.id);

      folder.placeBefore(verticalNode.id);
      return folder;
    } else {
      // add item
      const item = scene.addSource(verticalNode.sourceId, {
        id: horizontalNodeId,
        display: 'horizontal',
      });

      item.placeBefore(verticalNode.id);

      // position all of the nodes in the upper left corner of the vertical display
      // so that all of the sources are visible
      item.setTransform({ position: { x: 0, y: 0 } });

      // hide all horizontal scene items created via repair by default
      const visibility = repair ? false : verticalNode.visible;
      item.setVisibility(visibility);

      // match locked
      item.setLocked(verticalNode.locked);

      this.sceneCollectionsService.createNodeMapEntry(scene.id, item.id, verticalNode.id);
      return item;
    }
  }

  createVerticalNodes(sceneId: string) {
    this.SET_IS_LOADING(true);
    // establish vertical context if it doesn't exist
    if (this.state.dualOutputMode && !this.videoSettingsService.contexts.vertical) {
      this.videoSettingsService.establishVideoContext('vertical');
    }

    // the reordering of the nodes below is replicated from the copy nodes command
    const scene = this.scenesService.views.getScene(sceneId);
    const selection = new Selection(scene.id, scene.getNodes());
    const verticalNodes = [] as TSceneNode[];

    const initialNodeOrder = scene.getNodesIds();
    const nodeIdsMap: Dictionary<string> = {};

    selection.getNodes().forEach(node => {
      const verticalNode = this.createVerticalNode(node);
      nodeIdsMap[node.id] = verticalNode.id;
      verticalNodes.push(verticalNode);
    });

    // recreate parent/child relationships
    selection.getNodes().forEach(node => {
      const mappedNode = scene.getNode(nodeIdsMap[node.id]);
      const mappedParent = nodeIdsMap[node.parentId]
        ? scene.getNode(nodeIdsMap[node.parentId])
        : null;

      if (mappedParent) {
        mappedNode.setParent(mappedParent.id);
      }
    });

    const order = compact(scene.getNodesIds().map(origNodeId => nodeIdsMap[origNodeId]));
    scene.setNodesOrder(order.concat(initialNodeOrder));

    // set node map on scene to confirm node map has been loaded
    scene.setNodeMap(this.views.sceneNodeMaps[sceneId]);
    this.SET_IS_LOADING(false);
  }

  /**
   * Confirm scene node map is correct for dual output
   * @param sceneId - scene to confirm
   * @param nodeMap - node map to confirm
   * @returns
   */
  confirmSceneNodeMap(sceneId: string, nodeMap: Dictionary<string>) {
    // establish vertical context if it doesn't exist
    if (!this.videoSettingsService.contexts.vertical) {
      this.videoSettingsService.establishVideoContext('vertical');
    }

    const scene = this.scenesService.views.getScene(sceneId);
    const nodes = this.scenesService.views.getSceneNodesBySceneId(sceneId);
    if (!nodes) return;

    // node map with vertical node ids as keys and horizontal node ids as values
    const invertedNodeMap = invert(nodeMap);
    // the keys in the nodemap are the ids for the horizontal nodes
    const keys = Object.keys(nodeMap);
    const horizontalNodeIds = new Set(keys);
    // the values in the nodemap are the ids for the vertical nodes
    const values = Object.values(nodeMap);
    const verticalNodeIds = new Set(values);

    const nodeOrder: string[] = [];
    const repairedNodes = [] as TSceneNode[];
    const nodeIdsMap: Dictionary<string> = {};

    nodes.forEach((sceneNode: TSceneNode) => {
      if (sceneNode?.display === 'horizontal') {
        nodeOrder.push(sceneNode.id);
        const verticalNodeId = nodeMap[sceneNode.id];

        // confirm horizontal node has a partner vertical node
        if (verticalNodeId) {
          const verticalNode = scene.getNode(verticalNodeId);
          if (!verticalNode) {
            const verticalNode = this.createVerticalNode(sceneNode, verticalNodeId);
            nodeIdsMap[verticalNode.id] = sceneNode.id;
            repairedNodes.push(verticalNode);
          } else {
            nodeIdsMap[sceneNode.id] = verticalNodeId;
          }
        } else {
          // create vertical node and node map entry
          const verticalNode = this.createVerticalNode(sceneNode);
          nodeIdsMap[verticalNode.id] = sceneNode.id;
          repairedNodes.push(verticalNode);
        }

        // remove from keys because we have confirmed this entry
        horizontalNodeIds.delete(sceneNode.id);

        // confirm scene item has output, or assign one
        if (sceneNode?.output) return;
        this.assignNodeContext(sceneNode, 'horizontal');
      } else if (sceneNode?.display === 'vertical') {
        // confirm horizontal node
        if (!verticalNodeIds.has(sceneNode.id)) {
          // create horizontal node and node map entry
          const horizontalNode = this.createHorizontalNode(sceneNode, true);
          if (horizontalNode) {
            nodeOrder.push(horizontalNode.id);
            nodeIdsMap[horizontalNode.id] = sceneNode.id;
            repairedNodes.push(horizontalNode);
          }
        } else {
          const horizontalNodeId = invertedNodeMap[sceneNode.id];
          const horizontalNode = scene.getNode(horizontalNodeId);
          if (!horizontalNode) {
            const horizontalNode = this.createHorizontalNode(sceneNode, true, horizontalNodeId);
            nodeIdsMap[horizontalNode.id] = sceneNode.id;
            repairedNodes.push(horizontalNode);
          } else {
            nodeIdsMap[sceneNode.id] = horizontalNodeId;
          }
        }

        // confirm scene item has output, or assign one
        if (sceneNode?.output) return;
        this.assignNodeContext(sceneNode, 'vertical');
      } else {
        // otherwise assign it to the horizontal display and create a vertical node
        this.assignNodeContext(sceneNode, 'horizontal');
        const verticalNode = this.createVerticalNode(sceneNode);
        nodeOrder.push(sceneNode.id);
        nodeIdsMap[verticalNode.id] = sceneNode.id;
        repairedNodes.push(verticalNode);
      }
    });

    // after confirming all of the scene items, the Set of horizontal ids (or keys) should be empty
    // if there are any remaining values in the Set, these are incorrect entries in the scene node map
    // because they do not correspond to any node. To repair the scene node map, delete these incorrect entries.
    horizontalNodeIds.forEach((horizontalId: string) => {
      this.sceneCollectionsService.removeNodeMapEntry(horizontalId, sceneId);
    });

    // recreate parent/child relationships
    const selection = new Selection(sceneId, repairedNodes);
    selection.getNodes().forEach(node => {
      const mappedNode = scene.getNode(nodeIdsMap[node.id]);
      const mappedParent = nodeIdsMap[node.parentId]
        ? scene.getNode(nodeIdsMap[node.parentId])
        : null;

      if (mappedParent) {
        mappedNode.setParent(mappedParent.id);
      }
    });

    // confirm nodes have correct order in the scene
    const order = compact(nodeOrder.map(origNodeId => nodeIdsMap[origNodeId]));
    scene.setNodesOrder(order.concat(nodeOrder));

    // load node map into scene to show map was confirmed
    scene.setNodeMap(this.views?.sceneNodeMaps[sceneId]);
  }

  /**
   * Copy node or assign node context
   * @remark Currently, only the widget service needs to confirm the display,
   * all other function calls are to copy the horizontal node to a vertical node
   * @param sceneItem - the scene item to copy or assign context
   * @param display - the name of the context, which is also the display name
   * @param isHorizontalDisplay - whether this is the horizontal or vertical display
   * @param sceneId - the scene id where a copied node should be added, default is the active scene id
   * @returns
   */
  createOrAssignOutputNode(
    sceneItem: SceneItem,
    display: TDisplayType,
    isHorizontalDisplay: boolean,
    sceneId?: string,
    verticalNodeId?: string,
  ) {
    if (isHorizontalDisplay) {
      // if it's the first display, just assign the scene item's output to a context
      this.assignNodeContext(sceneItem, display);
      return sceneItem;
    } else {
      // if it's not the first display, copy the scene item
      const scene = this.scenesService.views.getScene(sceneId ?? this.views.activeSceneId);
      const copiedSceneItem = scene.addSource(sceneItem.sourceId, { id: verticalNodeId, display });

      if (!copiedSceneItem) return null;

      const selection = scene.getSelection(copiedSceneItem.id);
      this.editorCommandsService.executeCommand(
        'ReorderNodesCommand',
        selection,
        sceneItem.id,
        EPlaceType.Before,
      );

      this.sceneCollectionsService.createNodeMapEntry(sceneId, sceneItem.id, copiedSceneItem.id);
      return copiedSceneItem;
    }
  }

  assignNodeContext(node: TSceneNode, display: TDisplayType) {
    if (node.isItem()) {
      const context = this.videoSettingsService.contexts[display];
      if (!context) return null;
      node.setSettings({ output: context, display });
    } else {
      // because folders just group scene items, they do not have their own output value
      // set the display for toggling in the source selector
      node.setDisplay(display);
    }

    return node.id;
  }

  /**
   * Settings for platforms to displays
   */

  updatePlatformSetting(platform: string, display: TDisplayType) {
    this.UPDATE_PLATFORM_SETTING(platform, display);
  }

  updateDestinationSetting(destination: string, display?: TDisplayType) {
    this.UPDATE_DESTINATION_SETTING(destination, display);
  }

  /**
   * Confirm custom destinations have assigned displays
   */

  confirmDestinationDisplays() {
    const customDestinations = this.streamSettingsService.settings.goLiveSettings
      ?.customDestinations;
    if (!customDestinations) return;

    customDestinations.forEach((destination: ICustomStreamDestination, index: number) => {
      if (!destination.hasOwnProperty('display')) {
        const updatedDestinations = customDestinations.splice(index, 1, {
          ...destination,
          display: 'horizontal',
        });
        this.streamSettingsService.setGoLiveSettings({ customDestinations: updatedDestinations });
      }
    });
  }

  /**
   * Show/hide displays
   *
   * @param status - Boolean visibility of display
   * @param display - Name of display
   */
  toggleDisplay(status: boolean, display: TDisplayType) {
    this.SET_DISPLAY_ACTIVE(status, display);
  }

  /**
   * Update Video Settings
   */

  setVideoSetting(setting: Partial<IVideoInfo>, display?: TDisplayType) {
    this.SET_VIDEO_SETTING(setting, display);
  }

  updateVideoSettings(settings: IVideoInfo, display: TDisplayType = 'horizontal') {
    this.UPDATE_VIDEO_SETTING(settings, display);
  }

  setIsLoading(status: boolean) {
    this.SET_IS_LOADING(status);
  }

  @mutation()
  private UPDATE_PLATFORM_SETTING(platform: TPlatform | string, display: TDisplayType) {
    this.state.platformSettings = {
      ...this.state.platformSettings,
      [platform]: { ...this.state.platformSettings[platform], display },
    };
  }

  @mutation()
  private UPDATE_DESTINATION_SETTING(destination: string, display: TDisplayType = 'horizontal') {
    if (!this.state.destinationSettings[destination]) {
      // create setting
      this.state.destinationSettings = {
        ...this.state.destinationSettings,
        [destination]: {
          destination,
          display,
        },
      };
    } else {
      // update setting
      this.state.destinationSettings = {
        ...this.state.destinationSettings,
        [destination]: { ...this.state.destinationSettings[destination], display },
      };
    }
  }

  @mutation()
  private SET_SHOW_DUAL_OUTPUT(status?: boolean) {
    this.state = {
      ...this.state,
      dualOutputMode: status ?? !this.state.dualOutputMode,
    };
  }

  @mutation()
  private SET_DISPLAY_ACTIVE(status: boolean, display: TDisplayType) {
    this.state.videoSettings.activeDisplays = {
      ...this.state.videoSettings.activeDisplays,
      [display]: status,
    };
  }

  @mutation()
  private SET_VIDEO_SETTING(setting: Partial<IVideoInfo>, display: TDisplayType = 'vertical') {
    this.state.videoSettings[display] = {
      ...this.state.videoSettings[display],
      ...setting,
    };
  }

  @mutation()
  private UPDATE_VIDEO_SETTING(setting: IVideoInfo, display: TDisplayType = 'vertical') {
    this.state.videoSettings[display] = { ...setting };
  }

  @mutation()
  private SET_IS_LOADING(status: boolean) {
    this.state = { ...this.state, isLoading: status };
  }
}
