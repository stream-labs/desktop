import { Node } from '../node';
import { SceneItem } from '../../../scenes';
import uniqueId from 'lodash/uniqueId';
import path from 'path';
import fs from 'fs';

interface ISchema {
  filename: string;
}

interface IContext {
  assetsPath: string;
  sceneItem: SceneItem;
  savedAssets: Dictionary<string>;
}

export class ImageNode extends Node<ISchema, IContext> {
  schemaVersion = 1;

  async save(context: IContext) {
    const filePath = (context.sceneItem.getObsInput().settings as any).file;
    const newFileName = `${uniqueId()}${path.parse(filePath).ext}`;

    // Do not duplicate file if it has already been copied
    if (context.savedAssets[filePath]) {
      this.data = { filename: context.savedAssets[filePath] };
      return;
    }
    context.savedAssets[filePath] = newFileName;

    // Copy the image file
    const destination = path.join(context.assetsPath, newFileName);
    fs.writeFileSync(destination, fs.readFileSync(filePath));

    this.data = {
      filename: newFileName,
    };
  }

  async load(context: IContext) {
    const filePath = path.join(context.assetsPath, this.data.filename);
    const settings = { ...context.sceneItem.getObsInput().settings };
    settings['file'] = filePath;
    context.sceneItem.getObsInput().update(settings);

    // This is a bit of a hack to force us to immediately back up
    // the media upon overlay install.
    context.sceneItem.getSource().replacePropertiesManager('default', {});
  }
}
