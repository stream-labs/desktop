import { ApiClient } from './api-client';
import { ISceneApi, IScenesServiceApi, TSceneNode, TSceneNodeApi } from '../../app/services/scenes';
import { TSourceType } from '../../app/services/sources';

interface ISceneBuilderNode {
  name: string;
  type: 'item' | 'folder';
  sourceType?: TSourceType;
  id?: string;
  children?: ISceneBuilderNode[];
}

export class SceneBuilder {

  scene: ISceneApi;
  private scenesService: IScenesServiceApi;

  /**
   * `Item:` will be converted to this default type
   */
  private defaultSourceType: string = 'color_source';

  /**
   * how many spaces required to mark items as a child
   */
  private offsetSize = 2;

  constructor (api: ApiClient) {
    this.scenesService = api.getResource<IScenesServiceApi>('ScenesService');
    this.scene = this.scenesService.activeScene;
  }

  parse(scetch: string): ISceneBuilderNode[] {
    let strings = scetch.split('\n');
    let offset = -1;

    for (const str of strings) {
      // find offset of first non-space character
      if (str.trim().length === 0) continue;
      offset = str.search(/[^ ]/);
      if (offset !== -1) break;
    }

    if (offset === -1) {
      throw new Error('Invalid sketch');
    }

    // normalize sketch by removing spaces at the beginning of each line
    strings = strings.map(str => str.substr(offset));

    const foldersStack: ISceneBuilderNode[] = [];
    const result: ISceneBuilderNode[] = [];

    for (let lineInd = 0; lineInd < strings.length; lineInd++) {
      const line = strings[lineInd];
      const node = this.parseLine(line);

      if (!node) continue;
      const currentLineLevel = foldersStack.length;
      const currentFolder = foldersStack.slice(-1)[0];
      if (currentFolder) {
        currentFolder.children.push(node);
      } else {
        result.push(node);
      }

      const nextLine = strings[lineInd + 1];
      if (!nextLine) continue;

      const nextLineLevel = nextLine.search(/[^ ]/) / this.offsetSize;

      if (nextLineLevel > currentLineLevel) { // level down
        foldersStack.push(node);
      } else if (nextLineLevel < currentLineLevel) { // level up
        let i = currentLineLevel - nextLineLevel;
        while (i--) foldersStack.pop();
      }
    }

    return result;
  }

  private parseLine(line: string): ISceneBuilderNode {
    console.log('parse line', line);
    if (!line.trim()) return null;
    const isItem = line.indexOf(':') !== -1;
    if (isItem) {
      const [fullMatch, name, delemiter, sourceType] =
        line.match(/([a-zA-Z \d]+)(:)([a-zA-Z \d]*)/);
      return {
        name: name.trim(),
        type: 'item',
        sourceType: (sourceType.trim() || this.defaultSourceType) as TSourceType
      };
    }
    return {
      name: line.trim(),
      type: 'folder',
      children: []
    };
  }


  clearScene() {
    this.scene.getSelection().selectAll().remove();
  }



  build(scetch: string): ISceneBuilderNode[] {
    this.clearScene();
    const nodes = this.parse(scetch);
    return this.buildNodes(nodes);
  }

  isEqualTo(scetch: string): boolean {

  }

  getSceneSchema(): ISceneBuilderNode[] {

  }

  private buildNodes(nodes: ISceneBuilderNode[], parentId?: string): ISceneBuilderNode[] {
    nodes.reverse().forEach(node => {
      let sceneNode: TSceneNodeApi;

      if (node.type === 'item') {
        sceneNode = this.scene.createAndAddSource(node.name, node.sourceType);
      } else {
        sceneNode = this.scene.createFolder(node.name);
        if (node.children.length) this.buildNodes(node.children, sceneNode.id);
      }

      node.id = sceneNode.id;
      if (parentId) sceneNode.setParent(parentId);

    });

    return nodes;
  }

}
