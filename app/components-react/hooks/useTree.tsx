import { useState } from 'react';
import { EventDataNode, DataNode } from 'antd/lib/tree';
import { EPlaceType } from 'services/editor-commands/commands/reorder-nodes';

export interface IOnDropInfo {
  node: EventDataNode;
  dragNode: DataNode;
  dragNodesKeys: (string | number)[];
  dropPosition: number;
  dropToGap: boolean;
}

export function useTree(onlyLeaves?: boolean) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  function toggleFolder(key: string) {
    if (expandedFolders.includes(key)) {
      setExpandedFolders(expandedFolders.filter(k => k !== key));
    } else {
      setExpandedFolders(expandedFolders.concat([key]));
    }
  }

  function determinePlacement(info: IOnDropInfo) {
    if (!info.dropToGap) return EPlaceType.Inside;
    const dropPos = info.node.pos.split('-');
    const delta = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    return delta > 0 ? EPlaceType.After : EPlaceType.Before;
  }

  function treeSort(info: IOnDropInfo, state: DataNode[]) {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const loop = (data: DataNode[], key: string | number, callback: Function) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data[i], i, data);
        }
        if (data[i].children) loop(data[i].children as DataNode[], key, callback);
      }
    };
    const data = [...state];

    // Find dragObject
    let dragObj: DataNode | undefined;
    loop(data, dragKey, (item: DataNode, index: number, arr: DataNode[]) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    if (!info.dropToGap && !onlyLeaves) {
      // Drop on the content
      loop(data, dropKey, (item: DataNode) => {
        if (item.isLeaf || !dragObj) return;
        item.children = item.children || [];
        item.children.unshift(dragObj);
      });
    } else if (
      (info.node.children || []).length > 0 && // Has children
      info.node.expanded && // Is expanded
      dropPosition === 1 && // On the bottom gap
      !onlyLeaves
    ) {
      loop(data, dropKey, (item: DataNode) => {
        if (item.isLeaf || !dragObj) return;
        item.children = item.children || [];
        item.children.unshift(dragObj);
      });
    } else {
      let ar: DataNode[] = [];
      let i = 0;
      loop(data, dropKey, (item: DataNode, index: number, arr: DataNode[]) => {
        ar = arr;
        i = index;
      });
      if (!dragObj) return data;
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj);
      } else {
        ar.splice(i + 1, 0, dragObj);
      }
    }

    return data;
  }

  return { treeSort, determinePlacement, expandedFolders, setExpandedFolders, toggleFolder };
}
