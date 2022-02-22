import { EventDataNode, DataNode } from 'antd/lib/tree';

export interface IOnDropInfo {
  node: EventDataNode;
  dragNode: DataNode;
  dropPosition: number;
  dropToGap: boolean;
}

export function useTree(onlyLeaves?: boolean) {
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
    // Assert dragObj since Typescript doesn't like it being assigned in loop
    let dragObj!: DataNode;
    loop(data, dragKey, (item: DataNode, index: number, arr: DataNode[]) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    if (!info.dropToGap && !onlyLeaves) {
      // Drop on the content
      loop(data, dropKey, (item: DataNode) => {
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
        item.children = item.children || [];
        item.children.unshift(dragObj);
        // in previous version, we use item.children.push(dragObj) to insert the
        // item to the tail of the children
      });
    } else {
      let ar: DataNode[] = [];
      let i = 0;
      loop(data, dropKey, (item: DataNode, index: number, arr: DataNode[]) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj);
      } else {
        ar.splice(i + 1, 0, dragObj);
      }
    }

    return data;
  }

  return { treeSort };
}
