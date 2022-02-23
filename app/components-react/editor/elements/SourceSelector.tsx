import React, { useState, useRef } from 'react';
import { useVuex } from 'components-react/hooks';
import { SourceDisplayData } from 'services/sources';
import { TSceneNode, ISceneItemFolder, ISceneItem } from 'services/scenes';
import { EditMenu } from 'util/menus/EditMenu';
import { WidgetDisplayData } from 'services/widgets';
import { $t } from 'services/i18n';
import { EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';

interface ISceneNodeData {
  id: string;
  sourceId: string;
}

export default function SourceSelector() {
  const {
    ScenesService,
    SourcesService,
    SelectionService,
    EditorCommandsService,
    StreamingService,
    AudioService,
  } = Services;

  // sourcesTooltip = $t('The building blocks of your scene. Also contains widgets.');
  // addSourceTooltip = $t('Add a new Source to your Scene. Includes widgets.');
  // removeSourcesTooltip = $t('Remove Sources from your Scene.');
  // openSourcePropertiesTooltip = $t('Open the Source Properties.');
  // addGroupTooltip = $t('Add a Group so you can move multiple Sources at the same time.');

  // private expandedFoldersIds: string[] = [];

  const [expandedFolders, setExpandedFolders] = useState([]);

  const treeContainer = useRef<HTMLDivElement | null>(null);

  const [callCameFromInsideTheHouse, setInsideHouseCall] = useState(false);

  const {
    isSelected,
    scene,
    globalSelection,
    sceneNode,
    activeItemIds,
    lastSelectedId,
    selectiveRecordingEnabled,
  } = useVuex(() => ({
    scene: ScenesService.views.activeScene,
    activeItemIds: SelectionService.state.selectedIds,
    lastSelectedId: SelectionService.state.lastSelectedId,
    isSelected: (nodeId: string) => SelectionService.state.selectedIds.includes(nodeId),
    sceneNode: (nodeId: string) => ScenesService.views.getSceneNode(nodeId),
    globalSelection: SelectionService.views.globalSelection,
    selectiveRecordingEnabled: StreamingService.state.selectiveRecording,
  }));

  // get nodes(): ISlTreeNodeModel<ISceneNodeData>[] {
  //   // recursive function for transform SceneNode[] to ISlTreeNodeModel[]
  //   const getSlVueTreeNodes = (
  //     sceneNodes: (ISceneItem | ISceneItemFolder)[],
  //   ): ISlTreeNodeModel<ISceneNodeData>[] => {
  //     return sceneNodes.map(sceneNode => {
  //       return {
  //         title: this.getNameForNode(sceneNode),
  //         isSelected: this.isSelected(sceneNode),
  //         isLeaf: sceneNode.sceneNodeType === 'item',
  //         isExpanded: this.expandedFoldersIds.indexOf(sceneNode.id) !== -1,
  //         data: {
  //           id: sceneNode.id,
  //           sourceId: sceneNode.sceneNodeType === 'item' ? sceneNode.sourceId : null,
  //         },
  //         children:
  //           sceneNode.sceneNodeType === 'folder'
  //             ? getSlVueTreeNodes(this.getChildren(sceneNode))
  //             : null,
  //       };
  //     });
  //   };

  //   const nodes = this.scene.state.nodes.filter(n => !n.parentId);
  //   return getSlVueTreeNodes(nodes);
  // }

  // // TODO: Clean this up.  These only access state, no helpers
  // getNameForNode(node: ISceneItem | ISceneItemFolder) {
  //   if (node.sceneNodeType === 'item') {
  //     return this.sourcesService.state.sources[node.sourceId].name;
  //   }

  //   return node.name;
  // }

  // getChildren(node: ISceneItemFolder) {
  //   return this.scene.state.nodes.filter(n => n.parentId === node.id);
  // }

  function determineIcon(isLeaf: boolean, sourceId: string) {
    if (!isLeaf) {
      return 'fa fa-folder';
    }

    const source = SourcesService.state.sources[sourceId];

    if (source.propertiesManagerType === 'streamlabels') {
      return 'fas fa-file-alt';
    }

    if (source.propertiesManagerType === 'widget') {
      const widgetType = SourcesService.views.getSource(sourceId)?.getPropertiesManagerSettings()
        .widgetType;

      return WidgetDisplayData()[widgetType]?.icon || 'icon-error';
    }

    return SourceDisplayData()[source.type]?.icon || 'fas fa-file';
  }

  function addSource() {
    if (scene) {
      SourcesService.actions.showShowcase();
    }
  }

  function addFolder() {
    if (scene) {
      let itemsToGroup: string[] = [];
      let parentId: string;
      if (globalSelection.canGroupIntoFolder()) {
        itemsToGroup = globalSelection.getIds();
        const parent = globalSelection.getClosestParent();
        if (parent) parentId = parent.id;
      }
      ScenesService.actions.showNameFolder({
        itemsToGroup,
        parentId,
        sceneId: scene.id,
      });
    }
  }

  function showContextMenu(sceneNodeId?: string, event?: MouseEvent) {
    const sceneNode = scene?.getNode(sceneNodeId);
    let sourceId: string;

    if (sceneNode) {
      sourceId = sceneNode.isFolder() ? sceneNode.getItems()[0]?.sourceId : sceneNode.sourceId;
    }

    if (sceneNode && !sceneNode.isSelected()) sceneNode.select();
    const menuOptions = sceneNode
      ? { selectedSceneId: scene?.id, showSceneItemMenu: true, selectedSourceId: sourceId }
      : { selectedSceneId: scene?.id };

    const menu = new EditMenu(menuOptions);
    menu.popup();
    event && event.stopPropagation();
  }

  function removeItems() {
    globalSelection.remove();
  }

  function sourceProperties(nodeId: string) {
    const node = sceneNode(nodeId) || globalSelection.getNodes()[0];

    if (!node) return;

    const item = node.isItem() ? node : node.getNestedItems()[0];

    if (!item) return;
    if (item.type === 'scene') return ScenesService.actions.makeSceneActive(item.sourceId);
    if (!item.video) return AudioService.actions.showAdvancedSettings(item.sourceId);

    SourcesService.actions.showSourceProperties(item.sourceId);
  }

  function canShowProperties(): boolean | undefined {
    if (activeItemIds.length === 0) return false;
    const sceneNode = scene?.state.nodes.find(n => n.id === SelectionService.state.lastSelectedId);
    return sceneNode && sceneNode.sceneNodeType === 'item'
      ? SourcesService.views.getSource(sceneNode.sourceId)?.hasProps()
      : false;
  }

  function makeActive(treeNodes: any, ev: MouseEvent) {
    const ids = treeNodes.map(treeNode => treeNode.data.id);
    setInsideHouseCall(true);
    globalSelection.select(ids);
  }

  function toggleFolder(treeNode: any) {
    const nodeId = treeNode.data.id;
    if (treeNode.isExpanded) {
      setExpandedFolders(expandedFolders.filter(node => node === nodeId));
    } else {
      setExpandedFolders(expandedFolders.concat([nodeId]));
    }
  }

  // canShowActions(sceneNodeId: string) {
  //   return this.getItemsForNode(sceneNodeId).length > 0;
  // }

  // @Watch('lastSelectedId')
  // async expandSelectedFolders() {
  //   if (this.callCameFromInsideTheHouse) {
  //     this.callCameFromInsideTheHouse = false;
  //     return;
  //   }
  //   const node = this.scenesService.views.activeScene.getNode(this.lastSelectedId);
  //   if (!node || this.selectionService.state.selectedIds.length > 1) return;
  //   this.expandedFoldersIds = this.expandedFoldersIds.concat(node.getPath().slice(0, -1));

  //   await this.$nextTick();

  //   this.$refs[this.lastSelectedId].scrollIntoView({ behavior: 'smooth' });
  // }

  function toggleVisibility(sceneNodeId: string) {
    if (!scene) return;
    const selection = scene.getSelection(sceneNodeId);
    const visible = !selection.isVisible();
    EditorCommandsService.actions.executeCommand('HideItemsCommand', selection, !visible);
  }

  // // TODO: Refactor into elsewhere
  function getItemsForNode(sceneNodeId: string): ISceneItem[] {
    const node = scene?.state.nodes.find(n => n.id === sceneNodeId);

    if (node?.sceneNodeType === 'item') {
      return [node];
    }

    const children = scene?.state.nodes.filter(n => n.parentId === sceneNodeId);
    let childrenItems: ISceneItem[] = [];

    children?.forEach(c => (childrenItems = childrenItems.concat(getItemsForNode(c.id))));

    return childrenItems;
  }

  function toggleSelectiveRecording() {
    if (StreamingService.isReplayBufferActive || !StreamingService.isIdle) return;
    StreamingService.actions.setSelectiveRecording(!StreamingService.state.selectiveRecording);
  }

  function cycleSelectiveRecording(sceneNodeId: string) {
    const selection = scene?.getSelection(sceneNodeId);
    if (!selection || selection.isLocked()) return;
    if (selection.isStreamVisible() && selection.isRecordingVisible()) {
      selection.setRecordingVisible(false);
    } else if (selection.isStreamVisible()) {
      selection.setStreamVisible(false);
      selection.setRecordingVisible(true);
    } else {
      selection.setStreamVisible(true);
      selection.setRecordingVisible(true);
    }
  }

  function selectiveRecordingMetadata(sceneNodeId: string) {
    const selection = scene?.getSelection(sceneNodeId);
    if (selection?.isStreamVisible() && selection.isRecordingVisible()) {
      return { icon: 'icon-smart-record', tooltip: $t('Visible on both Stream and Recording') };
    }
    return selection?.isStreamVisible()
      ? { icon: 'icon-broadcast', tooltip: $t('Only visible on Stream') }
      : { icon: 'icon-studio', tooltip: $t('Only visible on Recording') };
  }

  function sourceIcons(sceneNodeId: string) {
    const items = getItemsForNode(sceneNodeId);
    const visible = items.some(i => i.visible);
    const locked = items.every(i => i.locked);
    return {
      visibleIcon: visible ? 'icon-view' : 'icon-hide',
      lockedIcon: locked ? 'icon-lock' : 'icon-unlock',
    };
  }

  function toggleLock(sceneNodeId: string) {
    const selection = scene?.getSelection(sceneNodeId);
    const locked = !selection?.isLocked();
    selection?.setSettings({ locked });
  }

  function isLocked(sceneNodeId: string) {
    return scene?.getSelection(sceneNodeId).isLocked();
  }
}
