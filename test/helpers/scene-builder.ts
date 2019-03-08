import { ApiClient } from './api-client';
import {
  ISceneApi,
  ISceneItemApi,
  IScenesServiceApi,
  TSceneNode,
  TSceneNodeApi,
  TSceneNodeType,
} from '../../app/services/scenes';
import { TSourceType } from '../../app/services/sources';

interface ISceneBuilderNode {
  name: string;
  type: 'item' | 'folder';
  sourceType?: TSourceType;
  id?: string;
  children?: ISceneBuilderNode[];
}

/**
 * SceneBuilder helps to create and compare the scene hierarchy via visual sketches
 * @example
 *
 * sceneBuilder.build(`
 *  Folder1
 *  Folder2
 *    Item1: image
 *    Item2: browser_source
 *  Folder3
 *    Item3:
 * `);
 *
 * sceneBuilder.scene.getNodeByName('Item3').remove();
 *
 * sceneBuilder.isEqualTo(`
 *  Folder1
 *  Folder2
 *    Item1: image
 *    Item2: browser_source
 *  Folder3
 * `);
 *
 */
export class SceneBuilder {
  private scenesService: IScenesServiceApi;

  /**
   * `Item:` will be converted to this default type
   */
  private defaultSourceType: string = 'color_source';

  /**
   * how many spaces required to mark items as a child
   */
  private offsetSize = 2;

  constructor(api: ApiClient) {
    this.scenesService = api.getResource<IScenesServiceApi>('ScenesService');
  }

  get scene(): ISceneApi {
    return this.scenesService.activeScene;
  }

  parse(sketch: string): ISceneBuilderNode[] {
    let strings = sketch.split('\n');
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

      if (nextLineLevel > currentLineLevel) {
        // level down
        foldersStack.push(node);
      } else if (nextLineLevel < currentLineLevel) {
        // level up
        let i = currentLineLevel - nextLineLevel;
        while (i--) foldersStack.pop();
      }
    }

    return result;
  }

  private parseLine(line: string): ISceneBuilderNode {
    if (!line.trim()) return null;
    const isItem = line.indexOf(':') !== -1;
    if (isItem) {
      const [fullMatch, name, delemiter, sourceType] = line.match(
        /([a-zA-Z_ .\-\d]+)(:)([a-zA-Z_ \d]*)/,
      );
      return {
        name: name.trim(),
        type: 'item',
        sourceType: (sourceType.trim() || this.defaultSourceType) as TSourceType,
      };
    }
    return {
      name: line.trim(),
      type: 'folder',
      children: [],
    };
  }

  build(scetch: string): ISceneBuilderNode[] {
    console.log('scene', this.scene.name, this.scene['_fallback'].name);
    this.scene.clear();
    const nodes = this.parse(scetch);
    return this.buildNodes(nodes);
  }

  isEqualTo(sketch: string): boolean {
    // normalize sketch
    // tslint:disable-next-line:no-parameter-reassignment TODO
    sketch = this.getSketch(this.parse(sketch));
    const sceneSketch = this.getSceneScketch();
    if (sketch === sceneSketch) return true;
    console.log(`Scene sketch:  \n\n${sceneSketch} \n is not equal to \n\n${sketch}`);
    return false;
  }

  getSceneSchema(folderId?: string): ISceneBuilderNode[] {
    const nodes = folderId ? this.scene.getFolder(folderId).getNodes() : this.scene.getRootNodes();

    return nodes.map(sceneNode => {
      if (sceneNode.isFolder()) {
        return {
          name: sceneNode.name,
          id: sceneNode.id,
          type: 'folder' as TSceneNodeType,
          children: this.getSceneSchema(sceneNode.id),
        };
      }

      return {
        name: sceneNode.name,
        id: sceneNode.id,
        type: 'item' as TSceneNodeType,
        sourceType: (sceneNode as ISceneItemApi).getSource().type,
      };
    });
  }

  getSceneScketch(): string {
    return this.getSketch(this.getSceneSchema());
  }

  getSketch(nodes: ISceneBuilderNode[], sketch?: string, level?: number): string {
    // tslint:disable-next-line:no-parameter-reassignment TODO
    sketch = sketch || '';

    // tslint:disable-next-line:no-parameter-reassignment TODO
    level = level || 0;

    nodes.forEach(node => {
      // tslint:disable-next-line:no-parameter-reassignment TODO
      sketch += ' '.repeat(level);

      if (node.type === 'item') {
        // tslint:disable-next-line:no-parameter-reassignment TODO
        sketch += `${node.name}: ${node.sourceType}\n`;
      } else if (node.type === 'folder') {
        // tslint:disable-next-line:no-parameter-reassignment TODO
        sketch += `${node.name}\n`;
        // tslint:disable-next-line:no-parameter-reassignment TODO
        sketch = this.getSketch(node.children, sketch, level + 1);
      }
    });

    return sketch;
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
