import { Node } from '../node';
import { SceneItem } from '../../../scenes';
import { TextNode } from './text';
import { Inject } from '../../../../util/injector';
import path from 'path';

interface ISchema {
  labelType: string;
  textSource: TextNode;
}

interface IContext {
  sceneItem: SceneItem;
  assetsPath: string;
}

export class StreamlabelNode extends Node<ISchema, IContext> {
  schemaVersion = 1;

  async save(context: IContext) {
    const textSource = new TextNode();
    await textSource.save(context);

    const labelType = context.sceneItem.source.getPropertiesManagerSettings().statname;

    this.data = { labelType, textSource };
  }

  async load(context: IContext) {
    await this.data.textSource.load(context);

    context.sceneItem.source.replacePropertiesManager('streamlabels', {
      statname: this.data.labelType
    });
  }
}
