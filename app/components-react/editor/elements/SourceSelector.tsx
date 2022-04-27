import React from 'react';
import { SourcesService, SourceDisplayData } from 'services/sources';
import { ScenesService, TSceneNode, ISceneItemFolder, ISceneItem } from 'services/scenes';
import { SelectionService } from 'services/selection';
import { EditMenu } from 'util/menus/EditMenu';
import { ISlTreeNode, ISlTreeNodeModel, ICursorPosition } from 'sl-vue-tree';
import { WidgetDisplayData } from 'services/widgets';
import { $t } from 'services/i18n';
import { EditorCommandsService } from 'services/editor-commands';
import { EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import { AudioService } from 'services/audio';
import { StreamingService } from 'services/streaming';
import { inject, injectState, injectWatch, mutation, useModule } from 'slap';
import { Tooltip, Tree } from 'antd';
import cx from 'classnames';
import { assertIsDefined, getDefined } from '../../../util/properties-type-guards';
import { DataNode } from 'rc-tree/lib/interface';
import { TreeProps } from 'rc-tree/lib/Tree';

interface ISceneNodeData {
  id: string;
  sourceId: string;
}

export class SourceSelectorModule {
  private scenesService = inject(ScenesService);
  private sourcesService = inject(SourcesService);
  private selectionService = inject(SelectionService);
  private editorCommandsService = inject(EditorCommandsService);
  private streamingService = inject(StreamingService);
  private audioService = inject(AudioService);

  sourcesTooltip = $t('The building blocks of your scene. Also contains widgets.');
  addSourceTooltip = $t('Add a new Source to your Scene. Includes widgets.');
  removeSourcesTooltip = $t('Remove Sources from your Scene.');
  openSourcePropertiesTooltip = $t('Open the Source Properties.');
  addGroupTooltip = $t('Add a Group so you can move multiple Sources at the same time.');

  state = injectState({
    expandedFoldersIds: [] as string[],
  });

  callCameFromInsideTheHouse = false;

  get treeData() {
    // recursive function for transforming SceneNode[] to a Tree format of Antd.Tree
    const getTreeNodes = (sceneNodes: (ISceneItem | ISceneItemFolder)[]): DataNode[] => {
      return sceneNodes.map(sceneNode => {
        return {
          title: (
            <TreeNode
              title={this.getNameForNode(sceneNode)}
              id={sceneNode.id}
              visibilityClasses={this.visibilityClassesForSource(sceneNode.id)}
              lockClasses={this.lockClassesForSource(sceneNode.id)}
              toggleVisibility={() => this.toggleVisibility(sceneNode.id)}
              toggleLock={() => this.toggleLock(sceneNode.id)}
            />
          ),
          isLeaf: sceneNode.sceneNodeType === 'item',
          key: sceneNode.id,
          children:
            sceneNode.sceneNodeType === 'folder'
              ? getTreeNodes(this.getChildren(sceneNode))
              : undefined,
        };
      });
    };

    const nodes = this.scene.state.nodes.filter(n => !n.parentId);
    return getTreeNodes(nodes);
  }

  // TODO: Clean this up.  These only access state, no helpers
  getNameForNode(node: ISceneItem | ISceneItemFolder) {
    if (node.sceneNodeType === 'item') {
      return this.sourcesService.state.sources[node.sourceId].name;
    }

    return node.name;
  }

  isSelected(node: ISceneItem | ISceneItemFolder) {
    return this.selectionService.state.selectedIds.includes(node.id);
  }

  getChildren(node: ISceneItemFolder) {
    return this.scene.state.nodes.filter(n => n.parentId === node.id);
  }

  determineIcon(isLeaf: boolean, sourceId: string) {
    if (!isLeaf) {
      return 'fa fa-folder';
    }

    const source = this.sourcesService.state.sources[sourceId];

    if (source.propertiesManagerType === 'streamlabels') {
      return 'fas fa-file-alt';
    }

    if (source.propertiesManagerType === 'widget') {
      const widgetType = this.sourcesService.views
        .getSource(sourceId)!
        .getPropertiesManagerSettings().widgetType;

      assertIsDefined(widgetType);

      return WidgetDisplayData()[widgetType]?.icon || 'icon-error';
    }

    return SourceDisplayData()[source.type]?.icon || 'fas fa-file';
  }

  addSource() {
    if (this.scenesService.views.activeScene) {
      this.sourcesService.showShowcase();
    }
  }

  addFolder() {
    if (this.scenesService.views.activeScene) {
      let itemsToGroup: string[] = [];
      let parentId: string = '';
      if (this.selectionService.views.globalSelection.canGroupIntoFolder()) {
        itemsToGroup = this.selectionService.views.globalSelection.getIds();
        const parent = this.selectionService.views.globalSelection.getClosestParent();
        if (parent) parentId = parent.id;
      }
      this.scenesService.showNameFolder({
        itemsToGroup,
        parentId,
        sceneId: this.scenesService.views.activeScene.id,
      });
    }
  }

  showContextMenu(sceneNodeId?: string, event?: React.MouseEvent) {
    const sceneNode = this.scene.getNode(sceneNodeId || '');
    let sourceId: string = '';

    if (sceneNode) {
      sourceId = sceneNode.isFolder() ? sceneNode.getItems()[0]?.sourceId : sceneNode.sourceId;
    }

    if (sceneNode && !sceneNode.isSelected()) sceneNode.select();
    const menuOptions = sceneNode
      ? { selectedSceneId: this.scene.id, showSceneItemMenu: true, selectedSourceId: sourceId }
      : { selectedSceneId: this.scene.id };

    const menu = new EditMenu(menuOptions);
    menu.popup();
    event && event.stopPropagation();
  }

  removeItems() {
    this.selectionService.views.globalSelection.remove();
  }

  sourceProperties(nodeId: string) {
    const node =
      this.scenesService.views.getSceneNode(nodeId) ||
      this.selectionService.views.globalSelection.getNodes()[0];

    if (!node) return;

    const item = node.isItem() ? node : node.getNestedItems()[0];

    if (!item) return;

    if (item.type === 'scene') {
      this.scenesService.actions.makeSceneActive(item.sourceId);
      return;
    }

    if (!item.video) {
      this.audioService.actions.showAdvancedSettings(item.sourceId);
      return;
    }

    this.sourcesService.actions.showSourceProperties(item.sourceId);
  }

  canShowProperties(): boolean {
    if (this.activeItemIds.length === 0) return false;
    const sceneNode = this.scene.state.nodes.find(
      n => n.id === this.selectionService.state.lastSelectedId,
    );
    return !!(sceneNode && sceneNode.sceneNodeType === 'item'
      ? this.sourcesService.views.getSource(sceneNode.sourceId)?.hasProps()
      : false);
  }

  onDrop(info: Parameters<Required<TreeProps>['onDrop']>[0]) {
    const nodesToMove = this.scene.getSelection(info.dragNodesKeys as string[]);
    const destNode = info.node;
    const destNodePos = Number(destNode.pos.split('-').slice(-1)[0]);

    let placement: 'before' | 'after' | 'inside';
    if (!info.dropToGap && !destNode.isLeaf) {
      placement = 'inside';
    } else if (destNodePos < info.dropPosition) {
      placement = 'after';
    } else {
      placement = 'before';
    }

    const destNodeId = destNode.key as string;

    if (placement === 'before') {
      this.editorCommandsService.executeCommand(
        'ReorderNodesCommand',
        nodesToMove,
        destNodeId,
        EPlaceType.Before,
      );
    } else if (placement === 'after') {
      this.editorCommandsService.executeCommand(
        'ReorderNodesCommand',
        nodesToMove,
        destNodeId,
        EPlaceType.After,
      );
    } else if (placement === 'inside') {
      this.editorCommandsService.executeCommand(
        'ReorderNodesCommand',
        nodesToMove,
        destNodeId,
        EPlaceType.Inside,
      );
    }
    this.selectionService.views.globalSelection.select(nodesToMove.getIds());
  }

  makeActive(ids: string[]) {
    this.callCameFromInsideTheHouse = true;
    this.selectionService.views.globalSelection.select(ids);
  }

  @mutation()
  toggleFolder(nodeId: string) {
    if (this.state.expandedFoldersIds.includes(nodeId)) {
      this.state.expandedFoldersIds.splice(this.state.expandedFoldersIds.indexOf(nodeId), 1);
    } else {
      this.state.expandedFoldersIds.push(nodeId);
    }
  }

  canShowActions(sceneNodeId: string) {
    return this.getItemsForNode(sceneNodeId).length > 0;
  }

  get lastSelectedId() {
    return this.selectionService.state.lastSelectedId;
  }

  watchSelected = injectWatch(() => this.lastSelectedId, this.expandSelectedFolders);

  async expandSelectedFolders() {
    if (this.callCameFromInsideTheHouse) {
      this.callCameFromInsideTheHouse = false;
      return;
    }
    const node = this.scene.getNode(this.lastSelectedId);
    if (!node || this.selectionService.state.selectedIds.length > 1) return;
    this.state.setExpandedFoldersIds(
      this.state.expandedFoldersIds.concat(node.getPath().slice(0, -1)),
    );

    // TODO
    // this.$refs[this.lastSelectedId].scrollIntoView({ behavior: 'smooth' });
  }

  get activeItemIds() {
    return this.selectionService.state.selectedIds;
  }

  get activeItems() {
    return this.selectionService.views.globalSelection.getItems();
  }

  toggleVisibility(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    const visible = !selection.isVisible();
    this.editorCommandsService.executeCommand('HideItemsCommand', selection, !visible);
  }

  // TODO: Refactor into elsewhere
  getItemsForNode(sceneNodeId: string): ISceneItem[] {
    const node = getDefined(this.scene.state.nodes.find(n => n.id === sceneNodeId));

    if (node.sceneNodeType === 'item') {
      return [node];
    }

    const children = this.scene.state.nodes.filter(n => n.parentId === sceneNodeId);
    let childrenItems: ISceneItem[] = [];

    children.forEach(c => (childrenItems = childrenItems.concat(this.getItemsForNode(c.id))));

    return childrenItems;
  }

  get selectiveRecordingEnabled() {
    return this.streamingService.state.selectiveRecording;
  }

  get streamingServiceIdle() {
    return this.streamingService.isIdle;
  }

  get replayBufferActive() {
    return this.streamingService.isReplayBufferActive;
  }

  get selectiveRecordingLocked() {
    return this.replayBufferActive || !this.streamingServiceIdle;
  }

  toggleSelectiveRecording() {
    if (this.selectiveRecordingLocked) return;
    this.streamingService.setSelectiveRecording(!this.streamingService.state.selectiveRecording);
  }

  cycleSelectiveRecording(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    if (selection.isLocked()) return;
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

  selectiveRecordingClassesForSource(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    if (selection.isStreamVisible() && selection.isRecordingVisible()) {
      return 'icon-smart-record';
    }
    return selection.isStreamVisible() ? 'icon-broadcast' : 'icon-studio';
  }

  selectiveRecordingTooltip(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    if (selection.isStreamVisible() && selection.isRecordingVisible()) {
      return $t('Visible on both Stream and Recording');
    }
    return selection.isStreamVisible()
      ? $t('Only visible on Stream')
      : $t('Only visible on Recording');
  }

  visibilityClassesForSource(sceneNodeId: string) {
    // TODO: Clean up - need views or similar
    const items = this.getItemsForNode(sceneNodeId);
    // Visible if at least 1 item is visible
    const visible = !!items.find(i => i.visible);

    return {
      'icon-view': visible,
      'icon-hide': !visible,
    };
  }

  lockClassesForSource(sceneNodeId: string) {
    // TODO: Clean up - need views or similar
    const items = this.getItemsForNode(sceneNodeId);
    // Locked if all items are locked
    const locked = !items.find(i => !i.locked);

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

  isLocked(sceneNodeId: string) {
    const selection = this.scene.getSelection(sceneNodeId);
    return selection.isLocked();
  }

  get scene() {
    const scene = getDefined(this.scenesService.views.activeScene);
    return scene;
  }
}

export default function SourceSelector() {
  useModule(SourceSelectorModule);
  return (
    <div className="source-selector">
      <StudioControls />
      <ItemsTree />
    </div>
  );
}

function StudioControls() {
  const {
    sourcesTooltip,
    addGroupTooltip,
    addSourceTooltip,
    removeSourcesTooltip,
    openSourcePropertiesTooltip,
    selectiveRecordingEnabled,
    selectiveRecordingLocked,
    activeItemIds,
    addSource,
    addFolder,
    removeItems,
    toggleSelectiveRecording,
    canShowProperties,
  } = useModule(SourceSelectorModule);

  return (
    <div className="studio-controls-top">
      <Tooltip title={sourcesTooltip}>
        <h2 className="studio-controls__label">{$t('Sources')}</h2>
      </Tooltip>

      <div>
        <Tooltip title={$t('Toggle Selective Recording')}>
          <i
            className={cx({
              'icon--active': selectiveRecordingEnabled,
              disabled: selectiveRecordingLocked,
              'icon-smart-record icon-button icon-button--lg': true,
            })}
            onClick={toggleSelectiveRecording}
          />
        </Tooltip>

        <Tooltip title={addGroupTooltip}>
          <i className="icon-add-folder icon-button icon-button--lg" onClick={addFolder} />
        </Tooltip>

        <Tooltip title={addSourceTooltip}>
          <i className="icon-add icon-button icon-button--lg" onClick={addSource} />
        </Tooltip>

        <Tooltip title={removeSourcesTooltip}>
          <i
            className={cx({
              'icon-subtract icon-button icon-button--lg': true,
              disabled: activeItemIds.length === 0,
            })}
            onClick={removeItems}
          />
        </Tooltip>

        <Tooltip title={openSourcePropertiesTooltip}>
          <i
            className={cx({ disabled: !canShowProperties(), 'icon-settings icon-button': true })}
            onClick={removeItems}
          />
        </Tooltip>
      </div>
    </div>
  );
}

function ItemsTree() {
  const {
    treeData,
    activeItemIds,
    expandedFoldersIds,
    showContextMenu,
    makeActive,
    toggleFolder,
    onDrop,
  } = useModule(SourceSelectorModule);

  return (
    <div className="vue-tree-container" onContextMenu={e => showContextMenu('', e)}>
      <Tree
        height={233}
        draggable={true}
        multiple={true}
        selectedKeys={activeItemIds}
        expandedKeys={expandedFoldersIds}
        onSelect={(selectedKeys, info) => makeActive([info.node.key as string])}
        onExpand={(selectedKeys, info) => toggleFolder(info.node.key as string)}
        onRightClick={info => showContextMenu(info.node.key as string, info.event)}
        onDrop={onDrop}
        treeData={treeData}
      />
    </div>
  );
}

function TreeNode(p: {
  title: string;
  id: string;
  visibilityClasses: Record<string, boolean>;
  lockClasses: Record<string, boolean>;
  toggleVisibility: (ev: unknown) => unknown;
  toggleLock: (ev: unknown) => unknown;
}) {
  return (
    <span>
      {p.title}
      <i onClick={p.toggleVisibility} className={cx(p.visibilityClasses)} />
      <i onClick={p.toggleLock} className={cx(p.lockClasses)} />
    </span>
  );
}
