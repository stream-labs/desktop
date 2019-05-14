import { Command } from './command';
import { Selection } from 'services/selection';
import { Inject } from 'services/core';
import { ScenesService, TSceneNode } from 'services/scenes';
import compact from 'lodash/compact';

export class CopyNodesCommand extends Command {
  @Inject() scenesService: ScenesService;

  /**
   * Maps original source ids to new source ids for deterministic
   * generation of of sources with consistent ids.
   */
  private sourceIdsMap: Dictionary<string>;

  /**
   * Maps original node ids to new node ids for deterministic
   * generation of of sources with consistent ids.
   */
  private nodeIdsMap: Dictionary<string> = {};

  constructor(
    private selection: Selection,
    private destSceneId: string,
    private duplicateSources = false,
  ) {
    super();
  }

  get description() {
    return `Paste ${this.selection.getNodes()[0].name}`;
  }

  execute() {
    const scene = this.scenesService.getScene(this.destSceneId);
    const insertedNodes: TSceneNode[] = [];

    // Duplicate necessary sources if needed
    if (this.duplicateSources) {
      this.sourceIdsMap = {};

      this.selection.getSources().forEach(source => {
        const dup = source.duplicate(this.sourceIdsMap[source.sourceId]);

        // If the source was marked as do-not-duplicate, dup will be null
        // In this case, use the original source
        this.sourceIdsMap[source.sourceId] = dup ? dup.sourceId : source.sourceId;
      });
    }

    // Create all nodes first
    this.selection.getNodes().forEach(node => {
      if (node.isFolder()) {
        const folder = scene.createFolder(node.name, { id: this.nodeIdsMap[node.id] });
        this.nodeIdsMap[node.id] = folder.id;
        insertedNodes.push(folder);
      } else {
        const sourceId =
          this.sourceIdsMap != null ? this.sourceIdsMap[node.sourceId] : node.sourceId;

        const item = scene.addSource(sourceId, { id: this.nodeIdsMap[node.id] });
        item.setSettings(node.getSettings());
        this.nodeIdsMap[node.id] = item.id;
        insertedNodes.push(item);
      }
    });

    // Recreate parent/child relationships
    this.selection.getNodes().forEach(node => {
      const mappedNode = scene.getNode(this.nodeIdsMap[node.id]);
      const mappedParent = this.nodeIdsMap[node.parentId]
        ? scene.getNode(this.nodeIdsMap[node.parentId])
        : null;

      if (mappedParent) {
        mappedNode.setParent(mappedParent.id);
      }
    });

    // Recreate node order
    // Selection does not have canonical node order - scene does
    const order = compact(
      this.selection
        .getScene()
        .getNodesIds()
        .map(origNodeId => this.nodeIdsMap[origNodeId]),
    );
    scene.setNodesOrder(order);

    return insertedNodes;
  }

  rollback() {
    // Rolling back this operation is as simple as removing all created items.
    // Any duplicated sources will be automatically deleted as the last scene
    // item referencing them is removed.
    const scene = this.scenesService.getScene(this.destSceneId);

    Object.values(this.nodeIdsMap).forEach(nodeId => {
      const node = scene.getNode(nodeId);
      if (node) node.remove();
    });
  }
}
