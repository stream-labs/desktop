import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { SourcesService } from 'services/sources';
import { ScenesService, ISceneItemNode, TSceneNode } from 'services/scenes';
import { SelectionService } from 'services/selection/selection';
import { EditMenu } from '../util/menus/EditMenu';
import SlVueTree, { ISlTreeNode, ISlTreeNodeModel, ICursorPosition } from 'sl-vue-tree';
import { WidgetType } from 'services/widgets';
import { $t } from 'services/i18n';

const widgetIconMap = {
  [WidgetType.AlertBox]: 'fas fa-bell',
  [WidgetType.StreamBoss]: 'fas fa-gavel',
  [WidgetType.EventList]: 'fas fa-th-list',
  [WidgetType.TipJar]: 'fas fa-beer',
  [WidgetType.DonationTicker]: 'fas fa-ellipsis-h',
  [WidgetType.ChatBox]: 'fas fa-comments',
  [WidgetType.ViewerCount]: 'fas fa-eye',
  [WidgetType.SpinWheel]: 'fas fa-chart-pie',
  [WidgetType.Credits]: 'fas fa-align-center',
  [WidgetType.SponsorBanner]: 'fas fa-heart',
  [WidgetType.DonationGoal]: 'fas fa-calendar',
  [WidgetType.BitGoal]: 'fas fa-calendar',
  [WidgetType.FollowerGoal]: 'fas fa-calendar',
  [WidgetType.SubGoal]: 'fas fa-calendar',
  [WidgetType.MediaShare]: 'icon-share',
};

const sourceIconMap = {
  ffmpeg_source: 'far fa-file-video',
  text_gdiplus: 'fas fa-font',
  text_ft2_source: 'fas fa-font',
  image_source: 'icon-image',
  slideshow: 'icon-image',
  dshow_input: 'icon-webcam',
  wasapi_input_capture: 'icon-mic',
  wasapi_output_capture: 'icon-audio',
  monitor_capture: 'fas fa-desktop',
  browser_source: 'fas fa-globe',
  game_capture: 'fas fa-gamepad',
  scene: 'far fa-object-group',
  color_source: 'fas fa-fill',
  openvr_capture: 'fab fa-simplybuilt fa-rotate-180',
  liv_capture: 'fab fa-simplybuilt fa-rotate-180',
};

@Component({
  components: { SlVueTree },
})
export default class SourceSelector extends Vue {
  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private selectionService: SelectionService;

  sourcesTooltip = $t('The building blocks of your scene. Also contains widgets.');
  addSourceTooltip = $t('Add a new Source to your Scene. Includes widgets.');
  removeSourcesTooltip = $t('Remove Sources from your Scene.');
  openSourcePropertiesTooltip = $t('Open the Source Properties.');
  addGroupTooltip = $t('Add a Group so you can move multiple Sources at the same time.');

  private expandedFoldersIds: string[] = [];

  $refs: {
    treeContainer: HTMLDivElement;
    slVueTree: SlVueTree<ISceneItemNode>;
  };

  get nodes(): ISlTreeNodeModel<ISceneItemNode>[] {
    // recursive function for transform SceneNode[] to ISlTreeNodeModel[]
    const getSlVueTreeNodes = (sceneNodes: TSceneNode[]): ISlTreeNodeModel<ISceneItemNode>[] => {
      return sceneNodes.map(sceneNode => {
        return {
          title: sceneNode.name,
          isSelected: sceneNode.isSelected(),
          isLeaf: sceneNode.isItem(),
          isExpanded: this.expandedFoldersIds.indexOf(sceneNode.id) !== -1,
          data: sceneNode.getModel(),
          children: sceneNode.isFolder() ? getSlVueTreeNodes(sceneNode.getNodes()) : null,
        };
      });
    };

    return getSlVueTreeNodes(this.scene.getRootNodes());
  }

  determineIcon(isLeaf: boolean, sourceId: string) {
    if (!isLeaf) {
      return 'fa fa-folder';
    }
    const sourceDetails = this.sourcesService.getSource(sourceId).getComparisonDetails();
    if (sourceDetails.isStreamlabel) {
      return 'fas fa-file-alt';
    }
    // We want simple equality here to also check for undefined
    if (sourceDetails.widgetType != null) {
      return widgetIconMap[sourceDetails.widgetType];
    }
    return sourceIconMap[sourceDetails.type] || 'fas fa-file';
  }

  addSource() {
    if (this.scenesService.activeScene) {
      this.sourcesService.showShowcase();
    }
  }

  addFolder() {
    if (this.scenesService.activeScene) {
      let itemsToGroup: string[] = [];
      let parentId: string;
      if (this.selectionService.canGroupIntoFolder()) {
        itemsToGroup = this.selectionService.getIds();
        const parent = this.selectionService.getClosestParent();
        if (parent) parentId = parent.id;
      }
      this.scenesService.showNameFolder({ itemsToGroup, parentId });
    }
  }

  showContextMenu(sceneNodeId?: string, event?: MouseEvent) {
    const sceneNode = this.scene.getNode(sceneNodeId);
    if (!sceneNode.isSelected()) sceneNode.select();
    const menuOptions = sceneNode
      ? {
          selectedSceneId: this.scene.id,
          showSceneItemMenu: true,
        }
      : { selectedSceneId: this.scene.id };

    const menu = new EditMenu(menuOptions);
    menu.popup();
    event && event.stopPropagation();
  }

  removeItems() {
    this.selectionService.remove();
  }

  sourceProperties() {
    if (!this.canShowProperties()) return;
    this.sourcesService.showSourceProperties(this.activeItems[0].sourceId);
  }

  canShowProperties(): boolean {
    if (this.activeItemIds.length === 0) return false;
    const sceneNode = this.selectionService.getLastSelected();
    return sceneNode && sceneNode.sceneNodeType === 'item'
      ? sceneNode.getSource().hasProps()
      : false;
  }

  handleSort(
    treeNodesToMove: ISlTreeNode<ISceneItemNode>[],
    position: ICursorPosition<TSceneNode>,
  ) {
    const nodesToMove = this.scene.getSelection(treeNodesToMove.map(node => node.data.id));

    const destNode = this.scene.getNode(position.node.data.id);

    if (position.placement === 'before') {
      nodesToMove.placeBefore(destNode.id);
    } else if (position.placement === 'after') {
      nodesToMove.placeAfter(destNode.id);
    } else if (position.placement === 'inside') {
      nodesToMove.setParent(destNode.id);
    }
    this.selectionService.select(nodesToMove.getIds());
  }

  makeActive(treeNodes: ISlTreeNode<ISceneItemNode>[], ev: MouseEvent) {
    const ids = treeNodes.map(treeNode => treeNode.data.id);
    this.selectionService.select(ids);
  }

  toggleFolder(treeNode: ISlTreeNode<ISceneItemNode>) {
    const nodeId = treeNode.data.id;
    if (treeNode.isExpanded) {
      this.expandedFoldersIds.splice(this.expandedFoldersIds.indexOf(nodeId), 1);
    } else {
      this.expandedFoldersIds.push(nodeId);
    }
  }

  canShowActions(sceneNodeId: string) {
    const node = this.scene.getNode(sceneNodeId);
    return node.isItem() || node.getNestedItems().length;
  }

  get activeItemIds() {
    return this.selectionService.getIds();
  }

  get activeItems() {
    return this.selectionService.getItems();
  }

  toggleVisibility(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    const visible = !selection.isVisible();
    selection.setSettings({ visible });
  }

  visibilityClassesForSource(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    const visible = selection.isVisible();

    return {
      'icon-view': visible,
      'icon-hide': !visible,
    };
  }

  lockClassesForSource(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    const locked = selection.isLocked();

    return {
      'icon-lock': locked,
      'icon-unlock': !locked,
    };
  }

  toggleLock(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    const locked = !selection.isLocked();
    selection.setSettings({ locked });
  }

  get scene() {
    return this.scenesService.activeScene;
  }
}
