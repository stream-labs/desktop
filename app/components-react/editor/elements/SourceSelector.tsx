import React, { useState, useRef, useEffect } from 'react';
import cx from 'classnames';
import { Tooltip, Tree } from 'antd';
import RCTree from 'rc-tree';
import { EventDataNode, DataNode } from 'antd/lib/tree';
import { SourceDisplayData } from 'services/sources';
import { TSceneNode, SceneItemFolder, SceneItem } from 'services/scenes';
import { EditMenu } from 'util/menus/EditMenu';
import { WidgetDisplayData } from 'services/widgets';
import { $t } from 'services/i18n';
import { isItem } from 'services/scenes/scene-node';
import { EPlaceType } from 'services/editor-commands/commands/reorder-nodes';
import { useVuex } from 'components-react/hooks';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { IOnDropInfo, useTree } from 'components-react/hooks/useTree';
import useBaseElement from './hooks';
import styles from './SceneSelector.m.less';

function SourceSelector() {
  const {
    ScenesService,
    SourcesService,
    SelectionService,
    StreamingService,
    AudioService,
    EditorCommandsService,
  } = Services;

  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [callCameFromInsideTheHouse, setInsideHouseCall] = useState(false);
  const treeRef = useRef<RCTree>(null);
  const { determinePlacement } = useTree();

  const {
    scene,
    globalSelection,
    sceneNode,
    activeItemIds,
    lastSelectedId,
    selectiveRecordingEnabled,
    activeScene,
    nameForSource,
  } = useVuex(() => ({
    scene: ScenesService.views.activeScene,
    activeItemIds: SelectionService.state.selectedIds,
    lastSelectedId: SelectionService.state.lastSelectedId,
    sceneNode: (nodeId: string) => ScenesService.views.getSceneNode(nodeId),
    nameForSource: (sourceId: string) => SourcesService.views.getNameForSource(sourceId),
    activeScene: ScenesService.views.activeScene,
    globalSelection: SelectionService.views.globalSelection,
    selectiveRecordingEnabled: StreamingService.state.selectiveRecording,
  }));

  useEffect(expandSelectedFolders, [lastSelectedId]);

  function nodes() {
    // recursive function for transform SceneNode[] to antd DataNode[]
    const getTreeNodes = (sceneNodes: TSceneNode[]): DataNode[] => {
      return sceneNodes.map(sceneNode => {
        let children;
        if (!isItem(sceneNode)) children = getTreeNodes(getChildren(sceneNode));
        const sourceId = isItem(sceneNode) ? sceneNode.sourceId : sceneNode.id;
        return {
          key: sceneNode.id,
          title: isItem(sceneNode) ? nameForSource(sourceId) : sceneNode.name,
          icon: determineIcon(isItem(sceneNode), sourceId),
          isLeaf: isItem(sceneNode),
          children,
        };
      });
    };

    const nodes = scene?.getNodes().filter(n => !n.parentId);
    if (!nodes) return [];
    return getTreeNodes(nodes);
  }

  function getChildren(node: SceneItemFolder) {
    if (!scene) return [];
    return scene.getNodes().filter(n => n.parentId === node.id);
  }

  function determineIcon(isLeaf: boolean, sourceId: string) {
    if (!isLeaf) return expandedFolders.includes(sourceId) ? 'fa fa-folder-open' : 'fa fa-folder';

    const source = SourcesService.views.getSource(sourceId);

    if (!source) return 'icon-error';

    if (source.propertiesManagerType === 'streamlabels') return 'fas fa-file-alt';

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
      let parentId: string | undefined;
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

  function showContextMenu(info: { event: React.MouseEvent; node: EventDataNode }) {
    info.event && info.event.stopPropagation();
    const sceneNode = scene?.getNode(info.node.key as string);

    if (sceneNode && !sceneNode.isSelected()) sceneNode.select();
    const menuOptions = sceneNode
      ? {
          selectedSceneId: scene?.id,
          showSceneItemMenu: true,
          selectedSourceId: sceneNode.isFolder()
            ? sceneNode.getItems()[0]?.sourceId
            : sceneNode.sourceId,
        }
      : { selectedSceneId: scene?.id };

    const menu = new EditMenu(menuOptions);
    menu.popup();
  }

  function removeItems() {
    globalSelection.remove();
  }

  function sourceProperties(nodeId?: string) {
    const node = nodeId ? sceneNode(nodeId) : globalSelection.getNodes()[0];

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

  function makeActive(
    selectedKeys: string[],
    info: { node: EventDataNode; nativeEvent: MouseEvent },
  ) {
    setInsideHouseCall(true);
    if (info.nativeEvent.shiftKey || info.nativeEvent.ctrlKey) {
      globalSelection.select(selectedKeys);
    } else {
      globalSelection.select([info.node.key as string]);
    }
  }

  function handleExpand(expandedKeys: string[]) {
    setExpandedFolders(expandedKeys);
  }

  function expandSelectedFolders() {
    if (callCameFromInsideTheHouse) {
      setInsideHouseCall(false);
      return;
    }
    const node = activeScene?.getNode(lastSelectedId);
    if (!node || SelectionService.state.selectedIds.length > 1) return;
    setExpandedFolders(expandedFolders.concat(node.getPath().slice(0, -1)));

    treeRef.current?.scrollTo({ key: lastSelectedId });
  }

  function toggleFolder(key: string) {
    if (expandedFolders.includes(key)) {
      setExpandedFolders(expandedFolders.filter(k => k !== key));
    } else {
      setExpandedFolders(expandedFolders.concat([key]));
    }
  }

  function toggleSelectiveRecording() {
    if (StreamingService.isReplayBufferActive || !StreamingService.isIdle) return;
    StreamingService.actions.setSelectiveRecording(!StreamingService.state.selectiveRecording);
  }

  function handleSort(info: IOnDropInfo) {
    const targetNodes = activeItemIds.length > 0 ? activeItemIds : (info.dragNodesKeys as string[]);
    const nodesToDrop = scene?.getSelection(targetNodes);
    const destNode = scene?.getNode(info.node.key as string);

    if (!nodesToDrop || !destNode) return;
    EditorCommandsService.actions.executeCommand(
      'ReorderNodesCommand',
      nodesToDrop,
      destNode?.id,
      determinePlacement(info),
    );
  }

  return (
    <>
      <div className={styles.topContainer} id="SourceSelector">
        <div className={styles.activeSceneContainer}>
          <span className={styles.activeScene}>{$t('Sources')}</span>
        </div>
        <Tooltip title={$t('Toggle Selective Recording')} placement="bottom">
          <i
            className={cx('icon-smart-record icon-button icon-button--lg', {
              active: selectiveRecordingEnabled,
              disabled: !StreamingService.isIdle,
            })}
            onClick={toggleSelectiveRecording}
          />
        </Tooltip>
        <Tooltip
          title={$t('Add a Group so you can move multiple Sources at the same time.')}
          placement="bottom"
        >
          <i className="icon-add-folder icon-button icon-button--lg" onClick={addFolder} />
        </Tooltip>
        <Tooltip title={$t('Add a new Source to your Scene. Includes widgets.')} placement="bottom">
          <i className="icon-add icon-button icon-button--lg" onClick={addSource} />
        </Tooltip>
        <Tooltip title={$t('Remove Sources from your Scene.')} placement="bottom">
          <i
            className={cx('icon-subtract icon-button icon-button--lg', {
              disabled: activeItemIds.length === 0,
            })}
            onClick={removeItems}
          />
        </Tooltip>
        <Tooltip title={$t('Open the Source Properties.')} placement="bottom">
          <i
            className={cx('icon-settings icon-button', { disabled: !canShowProperties() })}
            onClick={() => sourceProperties()}
          />
        </Tooltip>
      </div>
      <Scrollable style={{ height: '100%' }} className={styles.scenesContainer}>
        <Tree
          treeData={nodes()}
          onSelect={makeActive}
          onRightClick={showContextMenu}
          onExpand={handleExpand}
          onDrop={handleSort}
          onDoubleClick={() => sourceProperties()}
          selectedKeys={activeItemIds}
          expandedKeys={expandedFolders}
          ref={treeRef}
          titleRender={(node: DataNode) => <TreeNode node={node} expandFolder={toggleFolder} />}
          draggable
          blockNode
          multiple
        />
      </Scrollable>
    </>
  );
}

function TreeNode(p: { node: DataNode; expandFolder: (key: string) => void }) {
  const { ScenesService, EditorCommandsService, StreamingService } = Services;
  const { scene, selectiveRecordingEnabled } = useVuex(() => ({
    scene: ScenesService.views.activeScene,
    selectiveRecordingEnabled: StreamingService.state.selectiveRecording,
  }));

  function getItemsForNode(id: string): SceneItem[] {
    const sceneNode = scene?.getNodes().find(n => n.id === id);

    if (sceneNode && isItem(sceneNode)) {
      return [sceneNode];
    }

    const children = scene?.getNodes().filter(n => n.parentId === p.node.key);
    let childrenItems: SceneItem[] = [];

    children?.forEach(c => (childrenItems = childrenItems.concat(getItemsForNode(c.id))));

    return childrenItems;
  }

  const selection = scene?.getSelection(p.node.key as string);
  const items = getItemsForNode(p.node.key as string);
  const visible = items.some(i => i.visible);
  const locked = items.every(i => i.locked);

  function toggleLock() {
    const locked = !selection?.isLocked();
    selection?.setSettings({ locked });
  }

  function toggleVisibility() {
    if (!selection) return;
    const visible = !selection.isVisible();
    EditorCommandsService.actions.executeCommand('HideItemsCommand', selection, !visible);
  }

  function cycleSelectiveRecording() {
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

  function selectiveRecordingMetadata() {
    if (selection?.isStreamVisible() && selection.isRecordingVisible()) {
      return { icon: 'icon-smart-record', tooltip: $t('Visible on both Stream and Recording') };
    }
    return selection?.isStreamVisible()
      ? { icon: 'icon-broadcast', tooltip: $t('Only visible on Stream') }
      : { icon: 'icon-studio', tooltip: $t('Only visible on Recording') };
  }

  return (
    <div className={styles.sourceTitleContainer} data-name={p.node.title}>
      <i className={p.node.icon as string} onClick={() => p.expandFolder(p.node.key as string)} />
      <span className={styles.sourceTitle}>{p.node.title}</span>
      {items.length > 0 && (
        <div className={styles.sourceIcons}>
          {selectiveRecordingEnabled && (
            <Tooltip title={selectiveRecordingMetadata().tooltip}>
              <i
                className={cx(selectiveRecordingMetadata().icon, { disabled: locked })}
                onClick={cycleSelectiveRecording}
              />
            </Tooltip>
          )}
          <i className={locked ? 'icon-lock' : 'icon-unlock'} onClick={toggleLock} />
          <i className={visible ? 'icon-view' : 'icon-hide'} onClick={toggleVisibility} />
        </div>
      )}
    </div>
  );
}

export default function SourceSelectorElement() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { renderElement } = useBaseElement(
    <SourceSelector />,
    { x: 230, y: 120 },
    containerRef.current,
  );

  return (
    <div
      ref={containerRef}
      data-name="SourceSelector"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {renderElement()}
    </div>
  );
}
